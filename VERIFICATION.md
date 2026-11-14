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
| Mobile breakpoint interaction | Verified at 375px: no horizontal overflow, mobile menu and auth layouts render |
| Docker image execution | Not run; Docker socket access denied |
| Vercel production release | Ready at https://yantra-ai-murex.vercel.app |
| Firestore readiness | Live `/api/health` returned `ready: true` |
| Live database writes | Labeled contact test, rate-limit bucket and audit entry persisted in the isolated database |
| Production safe seed | Successful; build logs verified empty problem-statement storage |
| Firebase sign-in and first organizer | Live: sign-up, sign-in and organizer bootstrap verified; inbox delivery of verification email not independently confirmed |
| Participant workflow (live, via API) | Profile, team create/rename/invite/join/leave, notifications, account deletion verified; test data removed |
| Firestore indexes | 10 composite indexes deployed and READY on the `yantra` database |

## Changes verified

Completed the existing Firebase migration's compile-time and setup repairs. Active persistence uses the Firestore repository; broken Prisma imports, scripts, Docker steps, storage UI and PostgreSQL setup instructions were replaced. The original SQL schema remains under `legacy/postgresql`; no existing SQL data was imported or deleted.

Demo shortcuts require development mode, a loopback app URL, a loopback Firestore emulator, a `demo-` project and the `yantra_demo` namespace. Test launchers require the isolated `yantra_test` namespace and reject real Firebase targets. Existing local environment values were preserved; local Firebase defaults were added only when a Firebase project was not configured. A dedicated service identity and production-only workload provider now grant keyless access to the separate `yantra` database. No private service-account key was created.

New transport-contract tests cover Firestore value encoding, emulator restrictions, nested atomic writes, uniqueness, rollback, aborted-commit retry, unique-key release and empty inclusion queries. These use a mocked REST transport and do **not** establish actual Firestore integration. Rate-limit tests cover shared counts and window expiry. Cron tests cover malformed bearer tokens and bounded cleanup with expiration rechecks.

The supplied Firestore rules deny client access; server credentials use IAM. Compound index definitions are supplied for known filters. Indexes are deployed; live queries for dashboards, invitations and token claims were exercised. The adapter retains a bounded scan limit for administrator substring/relational searches; large installations need paginated query paths beyond that bound.

## Remaining release requirements

Organizers must publish official rules and open registration before participants can submit. Confirm that verification and reset emails reach real inboxes. Establish retention and recovery procedures. Upgrade to Next.js 16 and Zod 4 to clear dependency advisories (current advisories are build-time or not reachable from request schemas).

## Firebase-native update

The current checkout adds Firebase privileged account creation, password authentication, built-in verification/reset email, five-day signed session cookies, Google signature/issuer/audience checks, authoritative disabled/revoked-account checks, in-app event notices, secure shareable invitations, verified-email initial administrator bootstrap and durable provider account-deletion retries. Ten mocked authentication tests cover creation/recovery, recent sign-in, valid sessions, mismatched claims, expiry, revocation, disabled users and email operations. These checks do not establish live delivery.

The live release uses Firebase Authentication in `yantra-ai-auth-2026` with data in the `yantra` database of `neurobots-hub-7274`.
