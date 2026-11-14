# Deployment

YANTRA AI is a Next.js Node application backed by Firebase Cloud Firestore. Deploy to a Next.js-compatible Node host such as Vercel, or build the supplied standalone Docker image. The current build cannot be uploaded directly as a static website or Cloudflare Worker; its server routes and credential handling require the Node runtime.

## Required configuration

- `APP_URL`: exact public HTTPS origin.
- `FIREBASE_PROJECT_ID`: your actual Firebase project ID.
- `FIRESTORE_DATABASE_ID`: normally `(default)`.
- `FIRESTORE_NAMESPACE`: `yantra`, or another installation-specific name.
- On Vercel, set `GCP_WORKLOAD_IDENTITY_AUDIENCE` and `GCP_SERVICE_ACCOUNT_EMAIL` for keyless access. The Google provider must verify the exact production subject, issuer and audience. The app exchanges Vercel's signed runtime identity for a short-lived database token.
- Other Node hosts can use `FIREBASE_SERVICE_ACCOUNT_JSON` or `GOOGLE_APPLICATION_CREDENTIALS`. Configure server credentials in the hosting secret store.
- Remove `FIRESTORE_EMULATOR_HOST` in production. The application explicitly rejects emulator transport there.
- `FIREBASE_AUTH_PROJECT_ID` and `FIREBASE_AUTH_API_KEY` select Firebase email/password authentication and built-in verification/reset email. Enable Email/Password in the Firebase console. The API key is public project configuration but remains an environment value.
- `GCP_SERVICE_ACCOUNT_PROJECT_ID` identifies the existing workload service account project when authentication/data are in a different project. Grant that identity Firebase Authentication Admin and database-scoped Cloud Datastore User in the target project.
- `INITIAL_ADMIN_EMAIL` authorizes a one-time administrator bootstrap after authoritative email verification. No administrator password is seeded.
- `ADMIN_EMAILS` lists additional explicitly approved organizer addresses, separated by commas. Each address receives a one-time audited grant only after Firebase verifies ownership. For this installation, the user approved `maheswariaiml@skit.org.in`. It is set in production.
- `CRON_SECRET`: random private secret for maintenance. Vercel calls authenticated GET `/api/cron` daily using the schedule in `vercel.json`. Pending Firebase account deletions retry there. POST is also supported for operators.
- Keep `TRUST_PROXY=false` unless the edge replaces untrusted client-IP headers.

Production runs at https://yantra-ai-murex.vercel.app (Vercel project `neurobots1/yantra-ai`):

- **Data:** Cloud Firestore database `yantra` in `neurobots-hub-7274` (`asia-south1`), namespace `yantra`, with the composite indexes in `firebase/firestore.indexes.json`.
- **Sign-in:** Firebase Authentication in `yantra-ai-auth-2026` (email/password, built-in verification and reset emails).
- **Server identity:** keyless Vercel workload identity federation to `yantra-server@neurobots-hub-7274.iam.gserviceaccount.com`, which holds Firebase Authentication Admin on `yantra-ai-auth-2026`.
- **Organizers:** granted only to verified addresses in `INITIAL_ADMIN_EMAIL` / `ADMIN_EMAILS`; organizers use the console only and are excluded from participant data.
- **Maintenance:** `CRON_SECRET` is set; Vercel calls `/api/cron` daily.

`firebase.json` and `firebase.production.json` both read indexes from `firebase/firestore.indexes.json`. Deploy indexes only to the database the app uses (`--project neurobots-hub-7274`, database `yantra`); never point these configs at Neurobots Hub's unrelated `(default)` database. The `yantra-ai-auth-2026` `(default)` database exists but is unused, because `yantra-server` has no data grant there.

Run `npm ci`, `npm run db:seed`, `npm run typecheck`, `npm test` and `npm run build` with the appropriate environment. Seeding is insert-only and leaves registration closed. Do not point the demo or automated test launchers at production.

## Docker

```sh
docker compose up -d --build
```

The Compose service loads `.env` and binds to loopback port 3000; place an HTTPS reverse proxy in front. Container environment must use real Firebase credentials and the Firebase authentication configuration. There is no PostgreSQL dependency. Docker execution was not available in the current workspace, so image execution is unverified.

## Release checks

Before opening registration, verify `/api/health`, registration and real verification delivery, password reset, profile saving, invite/join, submission, organizer approval and notifications. Check desktop/mobile navigation and keyboard forms in a browser. Configure scheduled authenticated requests to `/api/cron` using the method and authorization defined in its route. Check backups, retention, usage/billing alerts and recovery procedures in the Firebase project.

Live verification (14 November 2026): sign-up, Firebase sign-in, profile save, team create/rename/invite/join/leave, notifications, password reset and resend-verification requests, account deletion, organizer-only console access and participant/organizer separation. Registration submission correctly stays closed until organizers publish rules and open registration. The local Firestore emulator on the development machine hangs on transactional reads, so portal UI was verified on production through the API.

Keep the project and hosting enabled through 25 November 2026. No shutdown or expiry is configured. Free service availability depends on provider quotas and account status. The requested hosting duration does not set an official hackathon date.

## Existing PostgreSQL installations

The previous schema/migrations are preserved under `legacy/postgresql/schema-and-migrations`. This release changes the persistence provider and does not include a production data-import utility. Take a backup, export and reconcile all relational records and uniqueness constraints before switching an existing event to Firestore. Do not assume an empty Firestore namespace contains previous participant records.
