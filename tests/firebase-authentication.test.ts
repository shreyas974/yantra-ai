import { beforeEach, expect, it, vi } from 'vitest';
import { exportSPKI, generateKeyPair, SignJWT } from 'jose';

vi.mock('@/lib/firebase/rest', () => ({ googleAccessToken: async () => 'scoped-service-token' }));
const project = 'yantra-auth-test';
beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('FIREBASE_AUTH_PROJECT_ID', project);
    vi.stubEnv('FIREBASE_AUTH_API_KEY', 'public-test-key');
});

it('creates an account through the authorized project endpoint then proves the password', async () => {
    const fetchMock = vi.fn()
        .mockResolvedValueOnce(Response.json({ localId: 'uid' }))
        .mockResolvedValueOnce(Response.json({ localId: 'uid', email: 'student@example.invalid', idToken: 'id-token' }));
    vi.stubGlobal('fetch', fetchMock);
    const { firebaseCreateAccount } = await import('@/lib/firebase/authentication');
    expect((await firebaseCreateAccount('student@example.invalid', 'safe-password')).localId).toBe('uid');
    expect(fetchMock.mock.calls[0][0]).toMatch(new RegExp(`/projects/${project}/accounts$`));
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer scoped-service-token');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).emailVerified).toBe(false);
    expect(fetchMock.mock.calls[1][0]).toContain('/accounts:signInWithPassword?');
});

it('recovers a provider account after an interrupted application registration using password proof', async () => {
    vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(Response.json({ error: { message: 'EMAIL_EXISTS' } }, { status: 400 }))
        .mockResolvedValueOnce(Response.json({ localId: 'uid', idToken: 'id-token' })));
    const { firebaseCreateAccount } = await import('@/lib/firebase/authentication');
    expect((await firebaseCreateAccount('student@example.invalid', 'safe-password')).localId).toBe('uid');
});

it('requires a recent sign-in before session exchange', async () => {
    const { privateKey } = await generateKeyPair('RS256');
    const token = await new SignJWT({ auth_time: Math.floor(Date.now() / 1000) - 600 }).setProtectedHeader({ alg: 'RS256' }).sign(privateKey);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { firebaseCreateSession } = await import('@/lib/firebase/authentication');
    await expect(firebaseCreateSession(token)).rejects.toThrow('RECENT_SIGN_IN_REQUIRED');
    expect(fetchMock).not.toHaveBeenCalled();
});

async function signedSession(options: { audience?: string; uid?: string; expired?: boolean } = {}) {
    const { privateKey, publicKey } = await generateKeyPair('RS256');
    const now = Math.floor(Date.now() / 1000);
    const token = await new SignJWT({ auth_time: now - 30 })
        .setProtectedHeader({ alg: 'RS256', kid: 'google-key' })
        .setIssuer(`https://session.firebase.google.com/${project}`)
        .setAudience(options.audience || project)
        .setSubject(options.uid || 'uid')
        .setIssuedAt(now - 10)
        .setExpirationTime(options.expired ? now - 1 : now + 300)
        .sign(privateKey);
    return { token, pem: await exportSPKI(publicKey), now };
}

it('verifies the signature, project and authoritative verified account', async () => {
    const { token, pem } = await signedSession();
    vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(Response.json({ 'google-key': pem }, { headers: { 'cache-control': 'max-age=3600' } }))
        .mockResolvedValueOnce(Response.json({ users: [{ localId: 'uid', email: 'student@example.invalid', emailVerified: true }] })));
    const { firebaseVerifySession } = await import('@/lib/firebase/authentication');
    expect((await firebaseVerifySession(token, 'uid')).emailVerified).toBe(true);
});

it.each([{ audience: 'another-project' }, { uid: 'another-user' }, { expired: true }])('rejects invalid session claims %j', async options => {
    const { token, pem } = await signedSession(options);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ 'google-key': pem })));
    const { firebaseVerifySession } = await import('@/lib/firebase/authentication');
    await expect(firebaseVerifySession(token, 'uid')).rejects.toThrow();
});

it.each(['disabled', 'revoked'])('rejects a %s account session', async reason => {
    const { token, pem, now } = await signedSession();
    vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(Response.json({ 'google-key': pem }))
        .mockResolvedValueOnce(Response.json({ users: [{ localId: 'uid', email: 'student@example.invalid', disabled: reason === 'disabled', validSince: reason === 'revoked' ? String(now) : '0' }] })));
    const { firebaseVerifySession } = await import('@/lib/firebase/authentication');
    await expect(firebaseVerifySession(token, 'uid')).rejects.toThrow();
});

it('uses Firebase built-in verification and reset email operations', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(Response.json({ email: 'student@example.invalid' })));
    vi.stubGlobal('fetch', fetchMock);
    const { firebaseSendVerification, firebaseSendPasswordReset } = await import('@/lib/firebase/authentication');
    await firebaseSendVerification('fresh-id-token');
    await firebaseSendPasswordReset('student@example.invalid');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ requestType: 'VERIFY_EMAIL', idToken: 'fresh-id-token' });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ requestType: 'PASSWORD_RESET', email: 'student@example.invalid' });
});
