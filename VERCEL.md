# Vercel deployment

Import this Next.js repository into your Vercel project. `vercel.json` defines `npm ci` and `npm run build:production`. The production build runs the insert-only configuration seed after compilation. The server uses Firebase Cloud Firestore; no Prisma generation or SQL migration is needed.

Configure the server-only production variables listed in [DEPLOYMENT.md](DEPLOYMENT.md). Remove the local emulator host and use a real Firebase project. Never prefix service credentials with `NEXT_PUBLIC_`. Configure the exact HTTPS deployment origin in `APP_URL`, then seed safe defaults from an operator terminal with the same Firebase target.

The readiness endpoint `/api/health` returns 200 only when the database responds; successful compilation alone does not verify the deployment. Validate real email delivery and the full participant/organizer workflow before opening registration. Schedule the outbox retry route and monitor failures.

Production is deployed at https://yantra-ai-murex.vercel.app. The release `8fafYR8LwT9Ga1bEAenEHZ2qs6VV` completed successfully on 14 November 2026. Google workload identity federation connects it to the isolated `yantra` database in `neurobots-hub-7274`. Live database readiness and contact-message persistence were verified. The build log confirms safe configuration seeding and empty problem-statement storage. The current checkout prepares a switch to the dedicated free Firebase project and built-in authentication email. Vercel email verification, environment changes, the new deployment and first verified organizer account remain pending.
