# Storage

Active application data uses Firebase Cloud Firestore under `namespaces/<FIRESTORE_NAMESPACE>`. Model collections hold users, hashed sessions/tokens, profiles, teams, invitations, registrations, content, contact messages, notifications, audit logs, rate-limit buckets and the email outbox. `_unique` documents reserve unique field values within the same transaction as each mutation. Roster mutations also touch the parent team revision to serialize competing changes.

`/admin/storage`, `/api/admin/storage` and `npm run storage:report` expose authenticated record counts and the configured project/database/namespace. They do not expose credentials. Storage bytes and plan quotas are intentionally null: record counts cannot establish billing usage. Follow the Firebase console link for actual usage.

`FIREBASE_STORAGE_BUCKET` identifies an optional bucket. Uploads remain disabled; no files are uploaded or counted. Development email files under `work/mail` are local files, not Firestore or bucket storage.

Emulator access requires a loopback endpoint and `demo-` project ID. Production forbids emulator transport. Demo/test namespaces are isolated from application data. Firestore queries that need local substring/relational filtering enforce a bounded scan; a scan-limit error must be resolved by narrowing the query or adding paginated data access, not by silently dropping records. The default bound is 5,000 records and the maximum is 20,000.

Service-account IAM controls server access. Supplied client rules deny browser reads and writes. Application data lives in the `yantra` named database in `neurobots-hub-7274` (Blaze plan). Authentication uses the separate Spark project `yantra-ai-auth-2026`; its `(default)` Firestore database is provisioned but unused.

The standard free allowance is 1 GiB stored data, 50,000 document reads/day, 20,000 writes/day, 20,000 deletes/day and 10 GiB outbound transfer/month, for one eligible database per project. Firebase email verification allows 1,000 messages/day on Spark and password reset allows 150/day. These are provider quotas, not measured remaining usage or a load-test result for 200 participants. In-app notices and shareable invitations avoid an external mail subscription. Password resets may need to be spread across days if all 200 participants request them together. [Firestore limits](https://firebase.google.com/docs/firestore/quotas) and [Authentication limits](https://firebase.google.com/docs/auth/limits).

Uploads remain disabled, so no Cloud Storage bucket allocation is required. Scheduled backups and point-in-time recovery have not been enabled for the `yantra` database; enable them in `neurobots-hub-7274` (Blaze) before registration opens. Authorized organizers can export participant and team CSV files. These exports are operational records, while a complete database recovery process remains pending. Historical PostgreSQL data remains separate. See [DEPLOYMENT.md](DEPLOYMENT.md).
