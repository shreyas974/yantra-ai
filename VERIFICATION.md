# Verification record — 2026-11-14

Working checkout: `/home/shreyas/Projects/chad`. This record supersedes the archived PostgreSQL verification report.

| Check | Actual result |
| --- | --- |
| TypeScript (`npm run typecheck`) | Passed |
| Unit/security/render/transport tests (`npm test`) | 69 passed across 14 files |
| Production Next.js build (`npm run build`) | Passed |
| Script syntax (`node --check`) | Local demo and test launchers passed |
| Dependency lock update | Passed offline; removed active Prisma dependency and generation hooks |
| Whitespace (`git diff --check`) | Passed |
| Integration/E2E safety gates | Both refuse an unconfigured/nonisolated target before starting |
| Firestore emulator integration | Not run: emulator unavailable; registry DNS fails with EAI_AGAIN |
| Local demo execution | Stops with an emulator-start instruction; no session claimed |
| Firestore storage report | Fails honestly when emulator is unavailable; no usage fabricated |
| Local listening socket probe | Fails with EPERM |
| Live browser checks | Home renders, real zero participant/team counts, contact-form save confirmed in Firebase, organizer route redirects to sign-in |
| Mobile breakpoint interaction | Unverified; requested viewport override retained the desktop document width |
| Docker image execution | Not run; Docker socket access denied |
| Vercel production release | Ready at https://yantra-ai-murex.vercel.app |
| Firestore readiness | Live `/api/health` returned `ready: true` |
| Live database writes | Labeled contact test, rate-limit bucket and audit entry persisted in the isolated database |
| Production safe seed | Successful; build logs verified empty problem-statement storage |
| Email delivery and first organizer | Firebase Authentication provisioned; native release deployment, delivery check and verified organizer registration pending |

## Changes verified

Completed the existing Firebase migration's compile-time and setup repairs. Active persistence uses the Firestore repository; broken Prisma imports, scripts, Docker steps, storage UI and PostgreSQL setup instructions were replaced. The original SQL schema remains under `legacy/postgresql`; no existing SQL data was imported or deleted.

Demo shortcuts require development mode, a loopback app URL, a loopback Firestore emulator, a `demo-` project and the `yantra_demo` namespace. Test launchers require the isolated `yantra_test` namespace and reject real Firebase targets. Existing local environment values were preserved; local Firebase defaults were added only when a Firebase project was not configured. A dedicated service identity and production-only workload provider now grant keyless access to the separate `yantra` database. No private service-account key was created.

New transport-contract tests cover Firestore value encoding, emulator restrictions, nested atomic writes, uniqueness, rollback, aborted-commit retry, unique-key release and empty inclusion queries. These use a mocked REST transport and do **not** establish actual Firestore integration. Rate-limit tests cover shared counts and window expiry. Cron tests cover malformed bearer tokens and bounded cleanup with expiration rechecks.

The supplied Firestore rules deny client access; server credentials use IAM. Compound index definitions are supplied for known filters. Index deployment and real query behavior remain unverified. The adapter retains a bounded scan limit for administrator substring/relational searches; large installations need paginated query paths beyond that bound.

## Remaining release requirements

Run the emulator integration and HTTP E2E commands from README.md in an environment permitting listening sockets. Verify desktop/mobile/keyboard flows in a browser. Complete the Vercel environment switch to the provisioned free Firebase project, configure the private maintenance secret, verify the exact HTTPS APP_URL and scheduled maintenance, and establish retention/recovery procedures. Run the real account-to-approval workflow in staging, including verification/reset email delivery.

Official event details, approved rules, dates and problem statements remain organizer-supplied. Registration defaults closed. Production deployment and database connectivity are verified. Full account-to-team-to-approval E2E testing remains pending email setup and account creation. One clearly labeled contact-form test record remains in the production database for inspection.

## Firebase-native update

The current checkout adds Firebase privileged account creation, password authentication, built-in verification/reset email, five-day signed session cookies, Google signature/issuer/audience checks, authoritative disabled/revoked-account checks, in-app event notices, secure shareable invitations, verified-email initial administrator bootstrap and durable provider account-deletion retries. Ten mocked authentication tests cover creation/recovery, recent sign-in, valid sessions, mismatched claims, expiry, revocation, disabled users and email operations. These checks do not establish live delivery.

The Spark project `yantra-ai-auth-2026`, email/password provider and default Firestore database were provisioned successfully. Server IAM grants were approved and applied. Vercel still requests an email code before its environment change can complete. The live release has not yet been switched. No new production account/password has been created.
