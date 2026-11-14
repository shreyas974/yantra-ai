import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';

export type FirestoreValue = { nullValue?: null; booleanValue?: boolean; integerValue?: string; doubleValue?: number; stringValue?: string; timestampValue?: string; arrayValue?: { values?: FirestoreValue[] }; mapValue?: { fields?: Record<string, FirestoreValue> } };
export type Document = { name: string; fields?: Record<string, FirestoreValue>; updateTime?: string };
export class FirebaseError extends Error {
  constructor(public code: string, public status: number) { super(`Firebase operation failed (${code}).`); }
}
let cachedToken: { value: string; expiresAt: number; identity: string } | undefined;
export function firebaseConfig() {
  const projectId = process.env.FIREBASE_PROJECT_ID || '';
  const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';
  const namespace = process.env.FIRESTORE_NAMESPACE || 'yantra';
  if (!/^[a-z][a-z0-9-]{4,62}$/.test(projectId)) throw new Error('Configure FIREBASE_PROJECT_ID for your Firebase project.');
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(namespace)) throw new Error('Invalid Firestore namespace.');
  if (!/^(\(default\)|[a-zA-Z0-9_-]+)$/.test(databaseId)) throw new Error('Invalid Firestore database ID.');
  const emulator = process.env.FIRESTORE_EMULATOR_HOST;
  if (emulator && (process.env.NODE_ENV === 'production' || !/^(localhost|127\.0\.0\.1|\[::1\]):\d+$/.test(emulator) || !projectId.startsWith('demo-'))) throw new Error('The Firebase emulator is restricted to local development with a demo- project ID.');
  const root = `projects/${projectId}/databases/${databaseId}`;
  return { projectId, databaseId, namespace, emulator, root, parent: `${root}/documents/namespaces/${namespace}`, host: emulator ? `http://${emulator}/v1` : 'https://firestore.googleapis.com/v1' };
}
async function serviceAccount(): Promise<{ client_email: string; private_key: string; project_id: string }> {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || (process.env.GOOGLE_APPLICATION_CREDENTIALS ? await readFile(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'utf8') : '');
  if (!json) throw new Error('Firebase server credentials are missing. Configure credentials in the deployment secret store.');
  const account = JSON.parse(json);
  if (!account.client_email || !account.private_key || account.project_id !== (process.env.GCP_SERVICE_ACCOUNT_PROJECT_ID || firebaseConfig().projectId)) throw new Error('Firebase credentials must match the configured service account project.');
  return account;
}
export async function googleAccessToken(): Promise<string> {
  const config = firebaseConfig();
  if (config.emulator) return '';
  if (process.env.GCP_WORKLOAD_IDENTITY_AUDIENCE) {
    const { federatedAccessToken } = await import('./federation');
    return federatedAccessToken();
  }
  const account = await serviceAccount();
  const identity = crypto.createHash('sha256').update(account.client_email + account.private_key).digest('hex');
  if (cachedToken?.identity === identity && cachedToken.expiresAt > Date.now() + 60000) return cachedToken.value;
  const now = Math.floor(Date.now() / 1000);
  const encode = (data: object) => Buffer.from(JSON.stringify(data)).toString('base64url');
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iss: account.client_email, scope: 'https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/identitytoolkit', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })}`;
  const signature = crypto.sign('RSA-SHA256', Buffer.from(unsigned), account.private_key).toString('base64url');
  const result = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${signature}` }), signal: AbortSignal.timeout(15000), cache: 'no-store' });
  if (!result.ok) throw new FirebaseError('AUTHENTICATION_FAILED', result.status);
  const data = await result.json();
  if (!data.access_token) throw new FirebaseError('AUTHENTICATION_FAILED', 401);
  cachedToken = { value: data.access_token, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000, identity };
  return cachedToken.value;
}
export async function firebaseRequest<T>(path: string, body?: object, method = body ? 'POST' : 'GET'): Promise<T> {
  const config = firebaseConfig();
  const token = await googleAccessToken();
  const response = await fetch(`${config.host}/${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), cache: 'no-store', signal: AbortSignal.timeout(20000) });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new FirebaseError(data.error?.status || 'UNAVAILABLE', response.status);
  }
  return response.status === 204 ? {} as T : response.json();
}
export function encodeValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === 'string') return { stringValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  return { mapValue: { fields: encodeFields(value as Record<string, unknown>) } };
}
export function encodeFields(data: Record<string, unknown>) { return Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined).map(([k, v]) => [k, encodeValue(v)])); }
export function decodeValue(value: FirestoreValue): any {
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return new Date(value.timestampValue!);
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('stringValue' in value) return value.stringValue;
  if ('arrayValue' in value) return (value.arrayValue?.values || []).map(decodeValue);
  return decodeFields(value.mapValue?.fields || {});
}
export function decodeFields(fields: Record<string, FirestoreValue>): Record<string, any> { return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, decodeValue(v)])); }
