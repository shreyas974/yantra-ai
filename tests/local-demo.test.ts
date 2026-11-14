import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { isLocalDemo } from '@/lib/local-demo';
const state = vi.hoisted(() => ({ user: vi.fn(), createSession: vi.fn(), setCookie: vi.fn(), audit: vi.fn(), limit: vi.fn() }));
vi.mock('@/lib/db', () => ({ db: { user: { findUnique: state.user }, auditLog: { create: state.audit } } }));
vi.mock('@/lib/auth', () => ({ createSession: state.createSession, setSessionCookie: state.setCookie }));
vi.mock('@/lib/rate-limit', () => ({ checkRateLimit: state.limit, rateKey: () => 'test', requestIdentity: () => 'test' }));
import { POST } from '@/app/api/demo/login/route';
const valid = { NODE_ENV: 'development', LOCAL_DEMO: 'true', APP_URL: 'http://127.0.0.1:3000', FIRESTORE_EMULATOR_HOST: '127.0.0.1:8080', FIREBASE_PROJECT_ID: 'demo-yantra', FIRESTORE_NAMESPACE: 'yantra_demo' } as NodeJS.ProcessEnv;
const req = (role = 'student') => new NextRequest('http://127.0.0.1:3000/api/demo/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
beforeEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe('Local-only demo gate', () => {
  it('requires every isolation condition', () => {
    expect(isLocalDemo(valid)).toBe(true);
    for (const change of [{ NODE_ENV: 'production' }, { LOCAL_DEMO: 'false' }, { APP_URL: 'https://chad.example.com' }, { FIRESTORE_EMULATOR_HOST: 'remote.example:8080' }, { FIREBASE_PROJECT_ID: 'live-project' }, { FIRESTORE_NAMESPACE: 'yantra' }, { FIRESTORE_EMULATOR_HOST: '' }]) expect(isLocalDemo({ ...valid, ...change })).toBe(false);
  });
  it('returns 404 in production before accessing user records', async () => {
    for (const [key, value] of Object.entries(valid)) vi.stubEnv(key, value);
    vi.stubEnv('NODE_ENV', 'production');
    expect((await POST(req('admin'))).status).toBe(404);
    expect(state.user).not.toHaveBeenCalled();
  });
  it('creates a real participant session in isolated development mode', async () => {
    for (const [key, value] of Object.entries(valid)) vi.stubEnv(key, value);
    state.limit.mockResolvedValue({ allowed: true }); state.user.mockResolvedValue({ id: 'student', role: 'USER', emailVerified: true }); state.createSession.mockResolvedValue('opaque-token');
    const response = await POST(req());
    expect(response.status).toBe(200); expect((await response.json()).redirect).toBe('/dashboard'); expect(state.createSession).toHaveBeenCalledWith('student'); expect(state.setCookie).toHaveBeenCalledWith('opaque-token');
  });
  it('does not upgrade a participant through organizer selection', async () => {
    for (const [key, value] of Object.entries(valid)) vi.stubEnv(key, value);
    state.limit.mockResolvedValue({ allowed: true }); state.user.mockResolvedValue({ id: 'student', role: 'USER', emailVerified: true });
    expect((await POST(req('admin'))).status).toBe(503); expect(state.createSession).not.toHaveBeenCalled();
  });
});
