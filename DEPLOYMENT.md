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
- `ADMIN_EMAILS` lists additional explicitly approved organizer addresses, separated by commas. Each address receives a one-time audited grant only after Firebase verifies ownership. For this installation, the user approved `maheswariaiml@skit.org.in`. This production variable still needs to be applied with the Firebase deployment.
- `CRON_SECRET`: random private secret for maintenance. Vercel calls authenticated GET `/api/cron` daily using the schedule in `vercel.json`. Pending Firebase account deletions retry there. POST is also supported for operators.
- Keep `TRUST_PROXY=false` unless the edge replaces untrusted client-IP headers.

The approved target is `(default)` Standard Firestore in `yantra-ai-auth-2026`, Mumbai (`asia-south1`), under the Spark plan. It has deny-all client rules. `firebase.production.json` targets this default database and must be deployed with `--project yantra-ai-auth-2026`. Never use that configuration against Neurobots Hub's unrelated default database. The workload service account remains in `neurobots-hub-7274` and has a conditional database grant in the new project. Its authentication grant is separately scoped to the new project.

The current live release still uses the previous isolated Blaze database until Vercel environment changes and the new release complete. No participant records existed at the last verified check. The labeled contact-form test remains in the previous database. Safe seeding creates missing generic configuration in the new database and preserves empty problem-statement storage.

Run `npm ci`, `npm run db:seed`, `npm run typecheck`, `npm test` and `npm run build` with the appropriate environment. Seeding is insert-only and leaves registration closed. Do not point the demo or automated test launchers at production.

## Docker

```sh
docker compose up -d --build
```

The Compose service loads `.env` and binds to loopback port 3000; place an HTTPS reverse proxy in front. Container environment must use real Firebase credentials and the Firebase authentication configuration. There is no PostgreSQL dependency. Docker execution was not available in the current workspace, so image execution is unverified.

## Release checks

Before opening registration, verify `/api/health`, registration and real verification delivery, password reset, profile saving, invite/join, submission, organizer approval and notifications. Check desktop/mobile navigation and keyboard forms in a browser. Configure scheduled authenticated requests to `/api/cron` using the method and authorization defined in its route. Check backups, retention, usage/billing alerts and recovery procedures in the Firebase project.

The first production release is available at https://yantra-ai-murex.vercel.app. A dedicated `yantra-server` service identity and production-only Vercel workload identity provider have been provisioned. Its existing grant on the previous database is preserved. The approved cross-project grants for the free database and authentication project have been added. The new release still needs Vercel configuration, deployment and live account checks. Local emulator and Docker execution remain unavailable in this workspace.

Keep the project and hosting enabled through 25 November 2026. No shutdown or expiry is configured. Free service availability depends on provider quotas and account status. The requested hosting duration does not set an official hackathon date.

## Existing PostgreSQL installations

The previous schema/migrations are preserved under `legacy/postgresql/schema-and-migrations`. This release changes the persistence provider and does not include a production data-import utility. Take a backup, export and reconcile all relational records and uniqueness constraints before switching an existing event to Firestore. Do not assume an empty Firestore namespace contains previous participant records.
