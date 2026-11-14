# YANTRA AI — Code. Create. Conquer.

AI/ML hackathon registration platform built with Next.js, React, TypeScript and Firebase Cloud Firestore. The working project is in this directory (`Projects/chad`); the `yantra-ai-source.tar.gz` archive contains the Firebase implementation.

## Features

- Responsive YANTRA AI public pages, animated geometric artwork, live participation totals, countdown and published event content.
- Email/password registration, verification, password reset, revocable hashed sessions and in-app notifications.
- Participant profiles, solo/team formation, email-bound invitations, capacity checks, leadership transfer and registration submission.
- Organizer dashboards for participants, teams, registration review, content, announcements, problem statements, contact messages, CSV exports and storage reporting.
- Transactional Firestore persistence, unique-key reservations, roster locks, Origin checks, shared rate limits, audit records and retryable notification mail.
- Server-only Firebase credentials; browser access to Firestore is denied by the supplied rules. File uploads are disabled.

Official event dates, venue, rules, sponsors, awards and problem statements must come from organizers. The seed preserves existing records, creates no participants or problem statements, and leaves registration closed.

## Live deployment

Production runs at https://yantra-ai-murex.vercel.app (Vercel project `neurobots1/yantra-ai`):

- **Data:** Cloud Firestore database `yantra` in `neurobots-hub-7274` (`asia-south1`), namespace `yantra`, with the composite indexes in `firebase/firestore.indexes.json`.
- **Sign-in:** Firebase Authentication in `yantra-ai-auth-2026` (email/password, built-in verification and reset emails).
- **Server identity:** keyless Vercel workload identity federation to `yantra-server@neurobots-hub-7274.iam.gserviceaccount.com`, which holds Firebase Authentication Admin on `yantra-ai-auth-2026`.
- **Organizers:** granted only to verified addresses in `INITIAL_ADMIN_EMAIL` / `ADMIN_EMAILS`; organizers use the console only and are excluded from participant data.
- **Maintenance:** `CRON_SECRET` is set; Vercel calls `/api/cron` daily.

Moving the data into `yantra-ai-auth-2026` would first require granting `yantra-server` Cloud Datastore User there; that grant does not exist today, so data stays in `neurobots-hub-7274`.

## Local development

Requires Node.js 22+, Java and the Firebase CLI for the Firestore emulator.

```sh
npm ci
cp .env.example .env
firebase emulators:start --only firestore --project demo-yantra
```

Keep the emulator running. In another terminal:

```sh
npm run db:seed
npm run dev -- --hostname 127.0.0.1
```

Open http://127.0.0.1:3000. Development mail is written to ignored private `work/mail/*.json` files; open the verification/reset URL in the relevant file. No email is sent in file mode. Emulator data is temporary unless you use the Firebase CLI's import/export options.

For local guest/student/organizer access, start the emulator above and run:

```sh
npm run demo
```

Open http://127.0.0.1:3000/guest. This creates real sessions for labeled example accounts in the separate `yantra_demo` namespace. It never enables registration or supplies official rules. The shortcut requires a development process, loopback app URL, loopback emulator, `demo-` project ID and the isolated demo namespace; production requests return 404. Use `DEMO_PORT=3001 npm run demo` if needed.

## Organizer configuration

Production can bootstrap the first administrator using `INITIAL_ADMIN_EMAIL`. Only an authoritative Firebase email verification for that exact address enables promotion. A transaction records a one-time marker and audit entry. The approved address for this installation is configured privately in Vercel.

For local legacy accounts or additional authorized operators, verify the email and run this command:

```sh
npm run admin:promote -- your-verified-address@example.com --confirm
```

Sign in again to use `/admin`; promotion revokes existing sessions and writes an audit entry. There is no seeded production administrator or password.

1. Set official event details, timezone, countdown target and team policy in `/admin/config`.
2. Enter approved rules while unpublished; text changes generate a new rules version. Publish them after review.
3. Add tracks, schedule, FAQs, prizes and sponsors through `/admin/content`. Drafts stay private.
4. Set a future registration deadline before opening submissions.
5. Review pending registrations. Rejection requires a reason; pending/approved teams have locked rosters. Rejected teams may correct and resubmit before the deadline.
6. Add official problem statements later; assign identifiers before publication.

## Verification

```sh
npm run typecheck
npm test
npm run build
```

Integration tests require the local Firestore emulator and an isolated test namespace. They refuse real Firebase projects:

```sh
FIREBASE_PROJECT_ID=demo-yantra FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIRESTORE_NAMESPACE=yantra_test npm run test:integration
FIREBASE_PROJECT_ID=demo-yantra FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 FIRESTORE_NAMESPACE=yantra_test npm run test:e2e
```

The HTTP test runner launches a temporary Next server and exercises account creation through organizer approval and logout. The test namespace must be dedicated to automated tests; configuration and audit/outbox records remain for inspection. Unit tests include mocked Firestore transport contract checks; those are not a substitute for emulator or deployed integration tests. See [VERIFICATION.md](VERIFICATION.md) for actual results and limits.

## Production

See [DEPLOYMENT.md](DEPLOYMENT.md) and [VERCEL.md](VERCEL.md). Use a real Firebase project and server credentials, remove `FIRESTORE_EMULATOR_HOST`, configure Firebase Authentication, HTTPS and the daily authenticated maintenance job. Firebase sends verification and password-reset emails. Event confirmations, approvals and organizer updates appear in-app. Team leaders share secure email-bound invitation links. External email subscriptions are unnecessary for this setup. `/api/health` returns 503 until Firestore responds. `/admin/storage` and `npm run storage:report` show real record counts; they do not claim billing byte usage.

The historical PostgreSQL schema and launcher references remain under `legacy/postgresql`. Active code no longer uses Prisma or SQL migrations. Existing PostgreSQL records are **not automatically copied to Firestore**; preserve and export them before any production cutover. Optional OAuth, project submissions, judging, payments and uploads are outside this registration platform.
