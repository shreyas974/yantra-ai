import { headers } from 'next/headers';

type AccessToken = { value: string; expiresAt: number; identity: string };
let cached: AccessToken | undefined;

export async function federatedAccessToken(): Promise<string> {
  const audience = process.env.GCP_WORKLOAD_IDENTITY_AUDIENCE || '';
  const email = process.env.GCP_SERVICE_ACCOUNT_EMAIL || '';
  if (!/^\/\/iam\.googleapis\.com\/projects\/\d+\/locations\/global\/workloadIdentityPools\/[a-z0-9-]+\/providers\/[a-z0-9-]+$/.test(audience)) {
    throw new Error('Configure the Google workload identity provider audience.');
  }
  const identityProject = process.env.GCP_SERVICE_ACCOUNT_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!email.endsWith(`@${identityProject}.iam.gserviceaccount.com`)) {
    throw new Error('The workload identity service account must match the Firebase project.');
  }
  const identity = `${audience}:${email}`;
  if (cached?.identity === identity && cached.expiresAt > Date.now() + 60000) return cached.value;

  // Vercel supplies this signed token on server requests. Google validates its
  // signature, issuer, audience and the provider's exact production subject.
  let token = process.env.VERCEL_OIDC_TOKEN;
  try {
    token = (await headers()).get('x-vercel-oidc-token') || token;
  } catch (error) {
    // Operator scripts and Vercel builds have no Next.js request context.
    if (!token) throw error;
  }
  if (!token) throw new Error('The deployment workload identity token is unavailable.');
  const exchange = await fetch('https://sts.googleapis.com/v1/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audience,
      grantType: 'urn:ietf:params:oauth:grant-type:token-exchange',
      requestedTokenType: 'urn:ietf:params:oauth:token-type:access_token',
      subjectTokenType: 'urn:ietf:params:oauth:token-type:jwt',
      subjectToken: token,
      scope: 'https://www.googleapis.com/auth/cloud-platform',
    }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!exchange.ok) throw new Error(`Workload identity exchange failed (${exchange.status}).`);
  const exchanged = await exchange.json();
  if (!exchanged.access_token) throw new Error('Google did not return a workload access token.');
  const result = await fetch(`https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${encodeURIComponent(email)}:generateAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${exchanged.access_token}` },
    body: JSON.stringify({ scope: ['https://www.googleapis.com/auth/datastore', 'https://www.googleapis.com/auth/identitytoolkit'], lifetime: '3600s' }),
    cache: 'no-store',
    signal: AbortSignal.timeout(15000),
  });
  if (!result.ok) throw new Error(`Service identity authorization failed (${result.status}).`);
  const data = await result.json();
  const expiresAt = Date.parse(data.expireTime);
  if (!data.accessToken || !Number.isFinite(expiresAt)) throw new Error('Google returned an invalid service access token.');
  cached = { value: data.accessToken, expiresAt, identity };
  return cached.value;
}
