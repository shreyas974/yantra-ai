# Vercel deployment

Import this Next.js repository into your Vercel project. `vercel.json` defines `npm ci` and `npm run build:production`. The production build runs the insert-only configuration seed after compilation. The server uses Firebase Cloud Firestore; no Prisma generation or SQL migration is needed.

Configure the server-only production variables listed in [DEPLOYMENT.md](DEPLOYMENT.md). Remove the local emulator host and use a real Firebase project. Never prefix service credentials with `NEXT_PUBLIC_`. Configure the exact HTTPS deployment origin in `APP_URL`, then seed safe defaults from an operator terminal with the same Firebase target.

The readiness endpoint `/api/health` returns 200 only when the database responds; successful compilation alone does not verify the deployment. Validate real email delivery and the full participant/organizer workflow before opening registration. Schedule the outbox retry route and monitor failures.

Production runs at https://yantra-ai-murex.vercel.app (Vercel project `neurobots1/yantra-ai`):

- **Data:** Cloud Firestore database `yantra` in `neurobots-hub-7274` (`asia-south1`), namespace `yantra`, with the composite indexes in `firebase/firestore.indexes.json`.
- **Sign-in:** Firebase Authentication in `yantra-ai-auth-2026` (email/password, built-in verification and reset emails).
- **Server identity:** keyless Vercel workload identity federation to `yantra-server@neurobots-hub-7274.iam.gserviceaccount.com`, which holds Firebase Authentication Admin on `yantra-ai-auth-2026`.
- **Organizers:** granted only to verified addresses in `INITIAL_ADMIN_EMAIL` / `ADMIN_EMAILS`; organizers use the console only and are excluded from participant data.
- **Maintenance:** `CRON_SECRET` is set; Vercel calls `/api/cron` daily.
