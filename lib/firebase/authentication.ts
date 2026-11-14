import { decodeJwt, importSPKI, importX509, jwtVerify } from 'jose';
import { googleAccessToken } from './rest';

export const FIREBASE_SESSION_SECONDS = 5 * 24 * 60 * 60;
export const firebaseAuthEnabled = () => Boolean(process.env.FIREBASE_AUTH_PROJECT_ID);

export class FirebaseAuthError extends Error {
  constructor(public code: string, public status: number) {
    super(`Firebase authentication failed (${code}).`);
  }
}

function configuration() {
  const projectId = process.env.FIREBASE_AUTH_PROJECT_ID || '';
  const apiKey = process.env.FIREBASE_AUTH_API_KEY || '';
  if (!/^[a-z][a-z0-9-]{4,62}$/.test(projectId) || !apiKey) {
    throw new FirebaseAuthError('CONFIGURATION_MISSING', 503);
  }
  return { projectId, apiKey };
}

async function request<T>(operation: string, body: object, privileged = false): Promise<T> {
  const { projectId, apiKey } = configuration();
  const path = privileged ? `projects/${projectId}${operation}` : `accounts:${operation}`;
  // Google rejects an API key and OAuth credential from different projects, and
  // the service identity may live outside the authentication project.
  const query = privileged ? '' : `?key=${encodeURIComponent(apiKey)}`;
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}${query}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(privileged ? { Authorization: `Bearer ${await googleAccessToken()}` } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const code = String(data.error?.message || 'UNAVAILABLE').match(/^[A-Z_]+/)?.[0] || 'UNAVAILABLE';
    throw new FirebaseAuthError(code, response.status);
  }
  return data as T;
}

export type FirebaseIdentity = { localId: string; email: string; idToken: string };
export type FirebaseAccount = { localId: string; email: string; emailVerified?: boolean; disabled?: boolean; validSince?: string };

export async function firebasePasswordSignIn(email: string, password: string): Promise<FirebaseIdentity> {
  const identity = await request<FirebaseIdentity>('signInWithPassword', { email, password, returnSecureToken: true });
  if (!identity.idToken || !identity.localId) throw new FirebaseAuthError('INVALID_RESPONSE', 503);
  return identity;
}

export async function firebaseCreateAccount(email: string, password: string): Promise<FirebaseIdentity> {
  try {
    // Privileged creation avoids funneling all participants through the public
    // signup endpoint's per-IP creation limit on a serverless host.
    await request('/accounts', { email, password, emailVerified: false }, true);
  } catch (error) {
    // A previous attempt can have created the provider identity before the
    // application transaction completed. Password proof permits safe recovery.
    if (!(error instanceof FirebaseAuthError) || error.code !== 'EMAIL_EXISTS') throw error;
  }
  return firebasePasswordSignIn(email, password);
}

export async function firebaseSendVerification(idToken: string) {
  await request('sendOobCode', { requestType: 'VERIFY_EMAIL', idToken });
}

export async function firebaseSendPasswordReset(email: string) {
  await request('sendOobCode', { requestType: 'PASSWORD_RESET', email });
}

export async function firebaseCreateSession(idToken: string): Promise<string> {
  const claims = decodeJwt(idToken);
  const now = Date.now() / 1000;
  if (typeof claims.auth_time !== 'number' || claims.auth_time > now + 30 || now - claims.auth_time > 300) {
    throw new FirebaseAuthError('RECENT_SIGN_IN_REQUIRED', 401);
  }
  // Google's exchange validates the ID token before issuing the signed cookie.
  const result = await request<{ sessionCookie: string }>(':createSessionCookie', {
    idToken, validDuration: String(FIREBASE_SESSION_SECONDS),
  }, true);
  if (!result.sessionCookie) throw new FirebaseAuthError('INVALID_RESPONSE', 503);
  return result.sessionCookie;
}

let certificates: { keys: Record<string, string>; expiresAt: number } | undefined;
async function sessionPublicKey(kid: string) {
  if (!certificates || certificates.expiresAt <= Date.now() || !certificates.keys[kid]) {
    const response = await fetch('https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys', {
      cache: 'no-store', signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new FirebaseAuthError('PUBLIC_KEYS_UNAVAILABLE', 503);
    const keys = await response.json();
    const maxAge = Number(response.headers.get('cache-control')?.match(/max-age=(\d+)/)?.[1] || 300);
    certificates = { keys, expiresAt: Date.now() + Math.min(maxAge, 86400) * 1000 };
  }
  const pem = certificates.keys[kid];
  if (typeof pem !== 'string') throw new FirebaseAuthError('INVALID_SESSION', 401);
  return pem.includes('BEGIN PUBLIC KEY') ? importSPKI(pem, 'RS256') : importX509(pem, 'RS256');
}

export async function firebaseGetAccount(uid: string): Promise<FirebaseAccount> {
  const data = await request<{ users?: FirebaseAccount[] }>('/accounts:lookup', { localId: [uid] }, true);
  const account = data.users?.find(user => user.localId === uid);
  if (!account || account.disabled) throw new FirebaseAuthError('ACCOUNT_UNAVAILABLE', 401);
  return account;
}

export async function firebaseVerifySession(cookie: string, expectedUid: string): Promise<FirebaseAccount> {
  const { projectId } = configuration();
  const { payload } = await jwtVerify(cookie, async header => {
    if (!header.kid || header.alg !== 'RS256') throw new FirebaseAuthError('INVALID_SESSION', 401);
    return sessionPublicKey(header.kid);
  }, {
    algorithms: ['RS256'],
    issuer: `https://session.firebase.google.com/${projectId}`,
    audience: projectId,
    requiredClaims: ['exp', 'iat', 'auth_time', 'sub'],
  });
  const now = Date.now() / 1000;
  if (payload.sub !== expectedUid || typeof payload.auth_time !== 'number' || payload.auth_time > now + 30 || !payload.iat || payload.iat > now + 30) {
    throw new FirebaseAuthError('INVALID_SESSION', 401);
  }
  const account = await firebaseGetAccount(expectedUid);
  if (Number(account.validSince || 0) > payload.auth_time) throw new FirebaseAuthError('SESSION_REVOKED', 401);
  return account;
}

export async function firebaseDeleteAccount(uid: string) {
  try {
    await request('/accounts:delete', { localId: uid }, true);
  } catch (error) {
    if (!(error instanceof FirebaseAuthError) || error.code !== 'USER_NOT_FOUND') throw error;
  }
}
