import crypto from 'node:crypto';
import { metadata } from './metadata';
import type { Models } from './models';
import { FirebaseError, firebaseConfig, firebaseRequest, decodeFields, encodeFields, encodeValue, type Document } from './rest';

type Model = keyof Models;
type Row = Record<string, any>;
export type Query = { where?: Row; include?: Row; select?: Row; orderBy?: Row | Row[]; take?: number };
type Relation = { model: Model; own: string; foreign: string; many?: boolean };
const relations: Partial<Record<Model, Record<string, Relation>>> = {
  user: { profile: { model: 'profile', own: 'id', foreign: 'userId' }, teamMembership: { model: 'teamMember', own: 'id', foreign: 'userId' }, sessions: { model: 'session', own: 'id', foreign: 'userId', many: true }, notifications: { model: 'notification', own: 'id', foreign: 'userId', many: true } },
  team: { leader: { model: 'user', own: 'leaderId', foreign: 'id' }, members: { model: 'teamMember', own: 'id', foreign: 'teamId', many: true }, invitations: { model: 'teamInvitation', own: 'id', foreign: 'teamId', many: true }, submission: { model: 'registrationSubmission', own: 'id', foreign: 'teamId' } },
  registrationSubmission: { team: { model: 'team', own: 'teamId', foreign: 'id' }, submittedBy: { model: 'user', own: 'submittedById', foreign: 'id' } },
  event: { settings: { model: 'eventSettings', own: 'id', foreign: 'eventId' }, tracks: { model: 'track', own: 'id', foreign: 'eventId', many: true }, schedule: { model: 'scheduleItem', own: 'id', foreign: 'eventId', many: true }, prizes: { model: 'prize', own: 'id', foreign: 'eventId', many: true }, faqs: { model: 'fAQ', own: 'id', foreign: 'eventId', many: true }, sponsors: { model: 'sponsor', own: 'id', foreign: 'eventId', many: true } },
  problemStatement: { trackRelation: { model: 'track', own: 'trackId', foreign: 'id' } },
  track: { problems: { model: 'problemStatement', own: 'id', foreign: 'trackId', many: true } },
};
for (const model of ['session','verificationToken','passwordResetToken','profile','teamMember','notification','auditLog'] as Model[]) {
  relations[model] = { ...relations[model], user: { model: 'user', own: 'userId', foreign: 'id' } };
}
for (const model of ['teamMember','teamInvitation'] as Model[]) relations[model] = { ...relations[model], team: { model: 'team', own: 'teamId', foreign: 'id' } };
const foreignKeys: Partial<Record<Model, Record<string, Model>>> = {
  session: { userId: 'user' }, verificationToken: { userId: 'user' }, passwordResetToken: { userId: 'user' }, profile: { userId: 'user' },
  team: { leaderId: 'user' }, teamMember: { userId: 'user', teamId: 'team' }, teamInvitation: { teamId: 'team' }, registrationSubmission: { teamId: 'team', submittedById: 'user' }, notification: { userId: 'user' }, auditLog: { userId: 'user' },
  eventSettings: { eventId: 'event' }, track: { eventId: 'event' }, scheduleItem: { eventId: 'event' }, prize: { eventId: 'event' }, fAQ: { eventId: 'event' }, sponsor: { eventId: 'event' }, problemStatement: { trackId: 'track' },
};
const hash = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
function uniquePath(model: Model, field: string, value: unknown) { return `_unique/${model}_${field}_${hash(String(value))}`; }
function isComparison(value: unknown) { return !value || typeof value !== 'object' || value instanceof Date || Object.keys(value as object).every(k => ['equals','in','lt','lte','gt','gte','contains','mode','not'].includes(k)); }
function compare(actual: any, condition: any): boolean {
  if (condition === null) return actual == null;
  if (condition instanceof Date) return actual instanceof Date && actual.getTime() === condition.getTime();
  if (typeof condition !== 'object') return actual === condition;
  const n = actual instanceof Date ? actual.getTime() : actual;
  for (const [op, raw] of Object.entries(condition)) {
    const value = raw instanceof Date ? raw.getTime() : raw;
    if (op === 'equals' && !compare(actual, raw)) return false;
    if (op === 'not' && compare(actual, raw)) return false;
    if (op === 'in' && !(raw as any[]).some(v => compare(actual, v))) return false;
    if (op === 'lt' && !(n < (value as any))) return false;
    if (op === 'lte' && !(n <= (value as any))) return false;
    if (op === 'gt' && !(n > (value as any))) return false;
    if (op === 'gte' && !(n >= (value as any))) return false;
    if (op === 'contains') { const text = String(actual || ''), query = String(raw); if (!(condition.mode === 'insensitive' ? text.toLowerCase().includes(query.toLowerCase()) : text.includes(query))) return false; }
  }
  return true;
}
function remoteFilter(model: Model, where: Row = {}): { filter?: any; complete: boolean } {
  const filters: any[] = []; let complete = true;
  for (const [key, value] of Object.entries(where)) {
    if (key === 'AND' || key === 'OR') {
      const terms = (Array.isArray(value) ? value : [value]).map(v => remoteFilter(model,v));
      if (terms.every(t => t.complete && t.filter)) filters.push({ compositeFilter: { op: key, filters: terms.map(t => t.filter) } }); else complete = false;
      continue;
    }
    if (relations[model]?.[key] || !isComparison(value)) { complete = false; continue; }
    const conditions = value && typeof value === 'object' && !(value instanceof Date) ? value : { equals: value };
    for (const [op, v] of Object.entries(conditions)) {
      if (op === 'mode') continue;
      if (op === 'contains' || op === 'not') { complete = false; continue; }
      if (v === null) { filters.push({ unaryFilter: { field: { fieldPath: key }, op: 'IS_NULL' } }); continue; }
      const mapped = ({ equals: 'EQUAL', in: 'IN', lt: 'LESS_THAN', lte: 'LESS_THAN_OR_EQUAL', gt: 'GREATER_THAN', gte: 'GREATER_THAN_OR_EQUAL' } as Row)[op];
      if (!mapped) throw new Error('Unsupported document query.');
      filters.push({ fieldFilter: { field: { fieldPath: key }, op: mapped, value: encodeValue(v) } });
    }
  }
  return { filter: filters.length > 1 ? { compositeFilter: { op: 'AND', filters } } : filters[0], complete };
}
export class FirestoreRepository {
  private staged = new Map<string, Row | null>();
  private loaded = new Map<string, Row | null>();
  constructor(private token?: string) {}
  private get config() { return firebaseConfig(); }
  private name(path: string) {
    const parts=path.split('/');
    if(parts.length!==2 || parts.some(v=>!/^[-A-Za-z0-9_.]{1,250}$/.test(v)||v==='.'||v==='..'))throw new Error('Invalid Firestore document path.');
    return `${this.config.parent}/${path}`;
  }
  private async read(path: string): Promise<Row | null> {
    if (this.staged.has(path)) return this.staged.get(path)!;
    if (this.token && this.loaded.has(path)) return this.loaded.get(path)!;
    try {
      const doc = await firebaseRequest<Document>(`${this.name(path)}${this.token ? `?transaction=${encodeURIComponent(this.token)}` : ''}`);
      const data = { ...decodeFields(doc.fields || {}), id: doc.name.split('/').pop()! };
      if(this.token)this.loaded.set(path,data); return data;
    } catch(e) { if (e instanceof FirebaseError && e.code === 'NOT_FOUND') { if(this.token)this.loaded.set(path,null); return null; } throw e; }
  }
  private stage(path: string, data: Row | null) { if (!this.token) throw new Error('Mutations require a Firestore transaction.'); this.staged.set(path,data); }
  async transaction<T>(work: (tx: Database) => Promise<T>): Promise<T> {
    if (this.token) return work(this.delegates());
    for (let attempt=0; attempt<5; attempt++) {
      const { transaction: token } = await firebaseRequest<{transaction:string}>(`${this.config.root}/documents:beginTransaction`, { options: { readWrite: {} } });
      const repository = new FirestoreRepository(token);
      try {
        const result = await work(repository.delegates());
        const writes = [...repository.staged].map(([path,data]) => data === null ? { delete: repository.name(path) } : { update: { name: repository.name(path), fields: encodeFields(data) } });
        if (writes.length > 450) throw new Error('This operation exceeds the bounded transaction size. Use a paginated administrator operation.');
        await firebaseRequest(`${this.config.root}/documents:commit`, { transaction: token, writes });
        return result;
      } catch(e) {
        await firebaseRequest(`${this.config.root}/documents:rollback`, { transaction: token }).catch(()=>{});
        if (e instanceof FirebaseError && e.code === 'ABORTED' && attempt < 4) { await new Promise(r=>setTimeout(r,25 * (attempt+1))); continue; }
        throw e;
      }
    }
    throw new Error('Transaction could not complete.');
  }
  async touch(model: Model, id: string) {
    if (!this.token) throw new Error('Transaction required.');
    const row = await this.read(`${model}/${id}`);
    if (!row) throw new Error('Document not found.');
    this.stage(`${model}/${id}`, { ...row, _revision: Number(row._revision || 0)+1 });
  }
  private async relation(model: Model, row: Row, field: string, query: Query = {}): Promise<any> {
    const rel = relations[model]?.[field];
    if (!rel) throw new Error(`Unsupported relation: ${model}.${field}`);
    if (row[rel.own] == null) return rel.many ? [] : null;
    const where = { ...query.where, [rel.foreign]: row[rel.own] };
    if (rel.foreign === 'id' && !rel.many) return this.findUnique(rel.model, { ...query, where });
    const items = await this.findMany(rel.model, { ...query, where });
    return rel.many ? items : items[0] || null;
  }
  private async matches(model: Model, row: Row, where: Row = {}): Promise<boolean> {
    for (const [key, condition] of Object.entries(where)) {
      if (key === 'AND') { for (const clause of (Array.isArray(condition)?condition:[condition])) if (!(await this.matches(model,row,clause))) return false; continue; }
      if (key === 'OR') { let match = false; for (const clause of condition) if(await this.matches(model,row,clause)) { match=true; break; } if(!match)return false; continue; }
      if (relations[model]?.[key]) { const rel = await this.relation(model,row,key); if (!rel || Array.isArray(rel) || !(await this.matches(relations[model]![key].model,rel,condition))) return false; }
      else if (!compare(row[key],condition)) return false;
    }
    return true;
  }
  private async project(model: Model, row: Row, query: Query): Promise<any> {
    const result: Row = query.select ? {} : {...row};
    for (const [key, selection] of Object.entries(query.select || query.include || {})) {
      if (!selection) continue;
      if (key === '_count') {
        result._count={};
        for(const field of Object.keys((selection as any).select || {})) result._count[field]=(await this.relation(model,row,field)).length;
      } else if (relations[model]?.[key]) result[key]=await this.relation(model,row,key,selection===true?{}:selection);
      else if (query.select) result[key]=row[key];
    }
    return result;
  }
  async findUnique<K extends Model>(model: K, query: Query): Promise<Models[K] | null> {
    const where=query.where || {}; const entries=Object.entries(where);
    if(entries.length!==1) { const rows=await this.findMany(model,{...query,take:1});return rows[0]||null; }
    const [field,value]=entries[0]; let id: string | undefined;
    if(field==='id') id=String(value);
    else if((metadata[model].unique as readonly string[]).includes(field)) id=(await this.read(uniquePath(model,field,value)))?.ownerId;
    else {const rows=await this.findMany(model,{...query,take:1});return rows[0]||null;}
    if(!id)return null;const row=await this.read(`${model}/${id}`);return row?this.project(model,row,query):null;
  }
  async findMany<K extends Model>(model: K, query: Query = {}): Promise<Models[K][]> {
    if (query.take === 0 || Object.values(query.where || {}).some(v => v && typeof v === 'object' && Array.isArray(v.in) && v.in.length === 0)) return [];
    const compiled=remoteFilter(model,query.where);
    // Substring/relational search is intentionally bounded; never silently drop matches.
    const scanLimit=Math.min(20000,Math.max(200,Number(process.env.FIRESTORE_QUERY_SCAN_LIMIT || 5000)));
    const structuredQuery: Row={from:[{collectionId:model}],...(compiled.filter?{where:compiled.filter}:{}),limit:scanLimit+1};
    const response=await firebaseRequest<{document?:Document}[]>(`${this.config.parent}:runQuery`,{structuredQuery,...(this.token?{transaction:this.token}:{})});
    const docs=response.flatMap(r=>r.document?[{...decodeFields(r.document.fields||{}),id:r.document.name.split('/').pop()!}]:[]);
    if(docs.length>scanLimit)throw new Error('Search exceeds the configured Firestore scan limit. Narrow the filter or use a paginated export.');
    const byId=new Map<string,Row>(docs.map(row=>[row.id,row]));
    for(const [path,row] of this.staged)if(path.startsWith(`${model}/`)){const id=path.split('/')[1];if(row===null)byId.delete(id);else byId.set(id,row);}
    const selected:Row[]=[];
    for(const row of byId.values()){if(await this.matches(model,row,query.where))selected.push(row);}
    const order=Array.isArray(query.orderBy)?query.orderBy:query.orderBy?[query.orderBy]:[];
    selected.sort((a,b)=>{for(const clause of order)for(const [field,dir]of Object.entries(clause)){const av=a[field] instanceof Date?a[field].getTime():a[field],bv=b[field] instanceof Date?b[field].getTime():b[field];if(av<bv)return dir==='desc'?1:-1;if(av>bv)return dir==='desc'?-1:1;}return 0;});
    return Promise.all(selected.slice(0,query.take??selected.length).map(row=>this.project(model,row,query)));
  }
  async count<K extends Model>(model: K, query: Query = {}): Promise<number> {
    if (Object.values(query.where || {}).some(v => v && typeof v === 'object' && Array.isArray(v.in) && v.in.length === 0)) return 0;
    const compiled=remoteFilter(model,query.where);
    if(this.token||!compiled.complete)return (await this.findMany(model,query)).length;
    const result=await firebaseRequest<any[]>(`${this.config.parent}:runAggregationQuery`,{structuredAggregationQuery:{structuredQuery:{from:[{collectionId:model}],...(compiled.filter?{where:compiled.filter}:{})},aggregations:[{alias:'total',count:{}}]}});
    return Number(result[0]?.result?.aggregateFields?.total?.integerValue||0);
  }
  private async enforceUnique(model:Model, before:Row|null, after:Row|null){
    for(const field of metadata[model].unique as readonly string[]){
      if(field==='id')continue;
      const previous=before?.[field],next=after?.[field];
      if(previous!=null&&previous!==next)this.stage(uniquePath(model,field,previous),null);
      if(next==null)continue;
      const path=uniquePath(model,field,next),reservation=await this.read(path);
      if(reservation&&reservation.ownerId!==after!.id)throw new Error(`A record with this ${field} already exists.`);
      this.stage(path,{ownerId:after!.id});
    }
  }
  async create<K extends Model>(model:K, args:{data:Row} & Query):Promise<Models[K]>{
    if(!this.token)return this.transaction<Models[K]>(tx=>tx[model].create(args) as Promise<Models[K]>);
    const data:Row={};for(const [key,value]of Object.entries(metadata[model].defaults))data[key]=value==='$now'?new Date():value==='$id'?crypto.randomUUID():value;
    for(const key of metadata[model].nullable)data[key]=null;
    const nested:Row={};for(const [key,value]of Object.entries(args.data)){if((metadata[model].relations as readonly string[]).includes(key))nested[key]=value;else data[key]=value;}
    data.id=data.id||crypto.randomUUID();
    if(await this.read(`${model}/${data.id}`))throw new Error('Document ID already exists.');
    for(const [field,target]of Object.entries(foreignKeys[model]||{}))if(data[field]!=null&&!(await this.read(`${target}/${data[field]}`)))throw new Error('Referenced document does not exist.');
    await this.enforceUnique(model,null,data);this.stage(`${model}/${data.id}`,data);
    for(const [key,value]of Object.entries(nested)){
      const rel=relations[model]?.[key];if(!rel||!(value as any).create)throw new Error('Unsupported nested document creation.');
      const list=Array.isArray((value as any).create)?(value as any).create:[(value as any).create];
      for(const child of list)await this.create(rel.model,{data:{...child,[rel.foreign]:data[rel.own]}});
    }
    return this.project(model,data,args);
  }
  async update<K extends Model>(model:K,args:{where:Row;data:Row}&Query):Promise<Models[K]>{
    if(!this.token)return this.transaction<Models[K]>(tx=>tx[model].update(args) as Promise<Models[K]>);
    const before=await this.findUnique(model,{where:args.where}) as Row|null;if(!before)throw new Error('Document not found.');
    const after={...before};for(const [field,value]of Object.entries(args.data)){if(value&&typeof value==='object'&&'increment'in value)after[field]=Number(after[field]||0)+Number(value.increment);else after[field]=value;}
    if('updatedAt'in metadata[model].defaults)after.updatedAt=new Date();
    for(const [field,target]of Object.entries(foreignKeys[model]||{}))if(after[field]!=null&&!(await this.read(`${target}/${after[field]}`)))throw new Error('Referenced document does not exist.');
    await this.enforceUnique(model,before,after);this.stage(`${model}/${before.id}`,after);return this.project(model,after,args);
  }
  async upsert<K extends Model>(model:K,args:{where:Row;create:Row;update:Row}&Query):Promise<Models[K]>{
    if(!this.token)return this.transaction<Models[K]>(tx=>tx[model].upsert(args) as Promise<Models[K]>);
    const existing=await this.findUnique(model,{where:args.where});return existing?this.update(model,{...args,data:args.update}):this.create(model,{...args,data:args.create});
  }
  async delete<K extends Model>(model:K,args:{where:Row}):Promise<Models[K]>{
    if(!this.token)return this.transaction<Models[K]>(tx=>tx[model].delete(args) as Promise<Models[K]>);
    const row=await this.findUnique(model,args) as Row|null;if(!row)throw new Error('Document not found.');
    const cascades:Partial<Record<Model,[Model,string][]>>={user:[['profile','userId'],['session','userId'],['verificationToken','userId'],['passwordResetToken','userId'],['notification','userId']],team:[['teamMember','teamId'],['teamInvitation','teamId'],['registrationSubmission','teamId']]};
    if(model==='user'&&((await this.count('teamMember',{where:{userId:row.id}}))||(await this.count('team',{where:{leaderId:row.id}}))))throw new Error('Leave the team before deleting this account.');
    for(const [child,key]of cascades[model]||[])await this.deleteMany(child,{where:{[key]:row.id}});
    if(model==='user')await this.updateMany('auditLog',{where:{userId:row.id},data:{userId:null}});
    if(model==='track')await this.updateMany('problemStatement',{where:{trackId:row.id},data:{trackId:null}});
    await this.enforceUnique(model,row,null);this.stage(`${model}/${row.id}`,null);return row as Models[K];
  }
  async createMany<K extends Model>(model:K,args:{data:Row[]}):Promise<{count:number}>{
    if(!this.token){let count=0;for(let i=0;i<args.data.length;i+=150)count+=(await this.transaction(tx=>tx[model].createMany({data:args.data.slice(i,i+150)}))).count;return{count};}
    for(const data of args.data)await this.create(model,{data});return{count:args.data.length};
  }
  async updateMany<K extends Model>(model:K,args:{where?:Row;data:Row}):Promise<{count:number}>{
    if(!this.token)return this.transaction(tx=>tx[model].updateMany(args));
    const rows=await this.findMany(model,{where:args.where});for(const row of rows)await this.update(model,{where:{id:row.id},data:args.data});return{count:rows.length};
  }
  async deleteMany<K extends Model>(model:K,args:{where?:Row}={}):Promise<{count:number}>{
    if(!this.token)return this.transaction(tx=>tx[model].deleteMany(args));
    const rows=await this.findMany(model,args);for(const row of rows)await this.delete(model,{where:{id:row.id}});return{count:rows.length};
  }
  delegates():Database{
    const result:Row={transaction:<T>(work:(tx:Database)=>Promise<T>)=>this.transaction(work),touch:(model:Model,id:string)=>this.touch(model,id),disconnect:async()=>{}};
    for(const model of Object.keys(metadata) as Model[])result[model]={
      findUnique:(q:Query)=>this.findUnique(model,q),findUniqueOrThrow:async(q:Query)=>{const row=await this.findUnique(model,q);if(!row)throw new Error('Document not found.');return row;},
      findMany:(q?:Query)=>this.findMany(model,q),count:(q?:Query)=>this.count(model,q),create:(q:any)=>this.create(model,q),update:(q:any)=>this.update(model,q),upsert:(q:any)=>this.upsert(model,q),delete:(q:any)=>this.delete(model,q),createMany:(q:any)=>this.createMany(model,q),updateMany:(q:any)=>this.updateMany(model,q),deleteMany:(q?:any)=>this.deleteMany(model,q),
    };return result as Database;
  }
}
export type Delegate<K extends Model>={findUnique(q:Query):Promise<Models[K]|null>;findUniqueOrThrow(q:Query):Promise<Models[K]>;findMany(q?:Query):Promise<Models[K][]>;count(q?:Query):Promise<number>;create(q:{data:Row}&Query):Promise<Models[K]>;update(q:{where:Row;data:Row}&Query):Promise<Models[K]>;upsert(q:{where:Row;create:Row;update:Row}&Query):Promise<Models[K]>;delete(q:{where:Row}):Promise<Models[K]>;createMany(q:{data:Row[]}):Promise<{count:number}>;updateMany(q:{where?:Row;data:Row}):Promise<{count:number}>;deleteMany(q?:{where?:Row}):Promise<{count:number}>};
export type Database={ [K in Model]:Delegate<K> } & {transaction<T>(work:(tx:Database)=>Promise<T>):Promise<T>;touch(model:Model,id:string):Promise<void>;disconnect():Promise<void>};
export const database = new FirestoreRepository().delegates();
