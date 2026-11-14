import { beforeEach, expect, it, vi } from 'vitest';

const requestHeaders = vi.hoisted(() => ({ token: 'signed-deployment-token' as string | null, available: true }));
vi.mock('next/headers', () => ({ headers: async () => {
  if (!requestHeaders.available) throw new Error('Outside request context');
  return new Headers(requestHeaders.token ? { 'x-vercel-oidc-token': requestHeaders.token } : {});
} }));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('FIREBASE_PROJECT_ID', 'project-yantra');
  vi.stubEnv('GCP_SERVICE_ACCOUNT_PROJECT_ID', '');
  vi.stubEnv('VERCEL_OIDC_TOKEN', '');
  vi.stubEnv('GCP_SERVICE_ACCOUNT_EMAIL', 'yantra@project-yantra.iam.gserviceaccount.com');
  vi.stubEnv('GCP_WORKLOAD_IDENTITY_AUDIENCE', '//iam.googleapis.com/projects/123456/locations/global/workloadIdentityPools/yantra/providers/vercel');
  requestHeaders.token = 'signed-deployment-token';
  requestHeaders.available = true;
});

it('exchanges the deployment identity and caches only the short-lived service token', async () => {
  vi.stubEnv('VERCEL_OIDC_TOKEN', 'old-build-token');
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({ access_token: 'exchange-token' }))
    .mockResolvedValueOnce(Response.json({ accessToken: 'service-token', expireTime: new Date(Date.now() + 3600000).toISOString() }));
  vi.stubGlobal('fetch', fetchMock);
  const { federatedAccessToken } = await import('@/lib/firebase/federation');
  expect(await federatedAccessToken()).toBe('service-token');
  expect(await federatedAccessToken()).toBe('service-token');
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).subjectToken).toBe('signed-deployment-token');
  expect(JSON.parse(fetchMock.mock.calls[1][1].body).scope).toEqual(['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/identitytoolkit']);
});

it('uses the build identity for operator scripts outside a Next request', async () => {
  requestHeaders.available = false;
  vi.stubEnv('VERCEL_OIDC_TOKEN', 'signed-build-token');
  const fetchMock = vi.fn()
    .mockResolvedValueOnce(Response.json({ access_token: 'exchange-token' }))
    .mockResolvedValueOnce(Response.json({ accessToken: 'service-token', expireTime: new Date(Date.now() + 3600000).toISOString() }));
  vi.stubGlobal('fetch', fetchMock);
  const { federatedAccessToken } = await import('@/lib/firebase/federation');
  expect(await federatedAccessToken()).toBe('service-token');
  expect(JSON.parse(fetchMock.mock.calls[0][1].body).subjectToken).toBe('signed-build-token');
});

it('rejects credentials for another Firebase project before exchange', async () => {
  vi.stubEnv('GCP_SERVICE_ACCOUNT_EMAIL', 'server@other-project.iam.gserviceaccount.com');
  const { federatedAccessToken } = await import('@/lib/firebase/federation');
  await expect(federatedAccessToken()).rejects.toThrow('match the Firebase project');
});

it('requires a runtime deployment identity', async () => {
  requestHeaders.token = null;
  const { federatedAccessToken } = await import('@/lib/firebase/federation');
  await expect(federatedAccessToken()).rejects.toThrow('unavailable');
});

it('rejects failed Google exchanges without exposing response credentials', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json({ error: 'private details' }, { status: 403 })));
  const { federatedAccessToken } = await import('@/lib/firebase/federation');
  await expect(federatedAccessToken()).rejects.toThrow('exchange failed (403)');
});
