import { beforeEach, describe, expect, it, vi } from 'vitest';
const transport = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock('@/lib/firebase/rest', async importOriginal => ({ ...await importOriginal<object>(), firebaseRequest: transport.request }));
import { FirestoreRepository } from '@/lib/firebase/repository';
import { decodeFields, encodeFields, encodeValue, decodeValue, FirebaseError, firebaseConfig } from '@/lib/firebase/rest';
const root = 'projects/demo-yantra/databases/(default)';
const parent = `${root}/documents/namespaces/yantra_test`;
let documents: Map<string, any>, commits: any[], aborts: number;
beforeEach(() => {
  vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('FIREBASE_PROJECT_ID', 'demo-yantra');
  vi.stubEnv('FIRESTORE_EMULATOR_HOST', '127.0.0.1:8080'); vi.stubEnv('FIRESTORE_NAMESPACE', 'yantra_test');
  documents = new Map(); commits = []; aborts = 0;
  transport.request.mockReset().mockImplementation(async (path: string, body: any) => {
    if (path.endsWith(':beginTransaction')) return { transaction: 'test-transaction' };
    if (path.endsWith(':rollback')) return {};
    if (path.endsWith(':commit')) {
      if (aborts-- > 0) throw new FirebaseError('ABORTED', 409);
      commits.push(body);
      for (const write of body.writes) {
        if (write.delete) documents.delete(write.delete);
        else documents.set(write.update.name, write.update);
      }
      return {};
    }
    if (path.endsWith(':runQuery')) return [...documents.values()].filter(d => d.name.startsWith(`${parent}/${body.structuredQuery.from[0].collectionId}/`)).map(document => ({ document }));
    const name = path.split('?')[0], doc = documents.get(name);
    if (!doc) throw new FirebaseError('NOT_FOUND', 404);
    return doc;
  });
});
const repository = () => new FirestoreRepository().delegates();
describe('Firestore persistence contract', () => {
  it('round trips timestamps, nulls, arrays, maps and numbers', () => {
    const value = { date: new Date('2026-11-14T00:00:00Z'), absent: null, nested: [true, 3, 1.25, { name: 'YANTRA' }] };
    expect(decodeValue(encodeValue(value))).toEqual(value);
    expect(decodeFields(encodeFields({ ...value, omitted: undefined }))).toEqual(value);
  });
  it('rejects production emulator use and nonlocal emulator hosts', () => {
    vi.stubEnv('NODE_ENV', 'production'); expect(firebaseConfig).toThrow('restricted');
    vi.stubEnv('NODE_ENV', 'test'); vi.stubEnv('FIRESTORE_EMULATOR_HOST', 'remote.example:8080'); expect(firebaseConfig).toThrow('restricted');
  });
  it('commits nested records and unique reservations atomically', async () => {
    const db = repository();
    const user = await db.user.create({ data: { email: 'one@example.invalid', passwordHash: 'hash', profile: { create: { fullName: 'One' } } }, include: { profile: true } });
    expect(user.profile?.fullName).toBe('One');
    expect(commits).toHaveLength(1);
    expect(commits[0].writes).toHaveLength(4);
    expect((await db.user.findUnique({ where: { email: user.email } }))?.id).toBe(user.id);
    await expect(db.user.create({ data: { email: user.email } })).rejects.toThrow('already exists');
    expect(commits).toHaveLength(1);
  });
  it('rolls back all staged changes when work fails', async () => {
    await expect(repository().transaction(async tx => {
      await tx.user.create({ data: { email: 'rollback@example.invalid' } });
      throw new Error('Stop transaction');
    })).rejects.toThrow('Stop transaction');
    expect(documents.size).toBe(0); expect(commits).toHaveLength(0);
    expect(transport.request).toHaveBeenCalledWith(`${root}/documents:rollback`, { transaction: 'test-transaction' });
  });
  it('retries aborted commits from a fresh transaction', async () => {
    aborts = 1;
    await repository().user.create({ data: { email: 'retry@example.invalid' } });
    expect(commits).toHaveLength(1);
    expect(transport.request.mock.calls.filter(([path]) => path.endsWith(':beginTransaction'))).toHaveLength(2);
  });
  it('releases old unique values on update and delete', async () => {
    const db = repository();
    const user = await db.user.create({ data: { email: 'before@example.invalid' } });
    await db.user.update({ where: { id: user.id }, data: { email: 'after@example.invalid' } });
    expect(await db.user.findUnique({ where: { email: 'before@example.invalid' } })).toBeNull();
    expect((await db.user.findUnique({ where: { email: 'after@example.invalid' } }))?.id).toBe(user.id);
    await db.user.delete({ where: { id: user.id } });
    expect(await db.user.findUnique({ where: { email: 'after@example.invalid' } })).toBeNull();
  });
  it('returns empty inclusion queries without issuing invalid Firestore IN filters', async () => {
    expect(await repository().user.findMany({ where: { id: { in: [] } } })).toEqual([]);
    expect(await repository().user.count({ where: { id: { in: [] } } })).toBe(0);
    expect(transport.request).not.toHaveBeenCalled();
  });
});
