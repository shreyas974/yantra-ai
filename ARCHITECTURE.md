# Current persistence architecture

Active persistence is Firebase Cloud Firestore, through `lib/db.ts`, `lib/firebase/repository.ts` and the authenticated REST transport in `lib/firebase/rest.ts`. Unique reservations and staged writes are committed atomically; aborted transactions retry. Team revision writes serialize roster changes. Server credentials are never sent to browsers. See README.md and DEPLOYMENT.md for current setup.

The approved target is the free `(default)` Standard database in `yantra-ai-auth-2026` in Mumbai. The previous live release remains on the isolated `yantra` database in `neurobots-hub-7274` until the Vercel switch completes. Vercel production workload identity impersonates a dedicated service account whose datastore grant is conditioned on this database. Build-time safe seeding inserts missing generic configuration. Unknown official event details remain configurable.

---

# YANTRA AI implementation architecture

## Stack and boundaries
Next.js App Router + React + TypeScript keeps server-rendered public pages, protected dashboards and JSON APIs in one deployable application. Tailwind, Motion and Lucide provide the design system. React Hook Form and Zod validate browser forms; Zod is authoritative again on the server. The Firestore repository validates relationships, reserves unique values and commits atomic transactions. Production passwords use Firebase Authentication. Five-day signed Firebase sessions use HttpOnly, SameSite=Lax and Secure cookies, signature/claim verification, revocation checks and hashed application session records. The local legacy demo retains bcrypt and file email. Firebase sends verification/reset mail, with event notifications delivered in-app and email-bound invitation links shared by leaders.

This checkout is the existing YANTRA AI application; extend it without deleting existing records. Production is deployed on Vercel. The current checkout prepares the approved Spark persistence/authentication switch. The application also supplies a standalone Docker build for a Node.js host.

## Complete structure
```
app/
  page.tsx                    # home, verified database counts
  about|tracks|schedule|prizes|rules|faq|contact|privacy/
  problem-statements/         # published official statements only
  register|login|verify-email|forgot-password|reset-password/
  dashboard/                  # authenticated participant overview
    profile|team|registration|notifications/
  admin/                      # server-protected administrator overview
    registrations|config|announcements|problem-statements|messages|content|participants|teams/
  api/
    auth/{register,login,logout,verify-email,forgot-password,reset-password,resend-verification}
    profile|team|registration/submit|contact|notifications|account
    team/{invite,join,leave,manage}
    admin/{config,metrics,registrations,export,announcements,problem-statements,content,participants,teams}
components/                   # navigation, footer, countdown, neural motif, reusable forms
lib/                          # database, auth, email, policies, transactions, CSV, rate limits
lib/firebase/models.ts       # canonical entity types
lib/firebase/metadata.ts     # defaults, relationships and uniqueness
lib/firebase/repository.ts   # transactions and model queries
lib/firebase/rest.ts         # authenticated Firestore transport
lib/firebase/federation.ts   # keyless Vercel-to-Google authentication
firebase/                    # client rules and index definitions
scripts/seed.ts              # insert missing generic defaults
scripts/                      # explicit administrator promotion, deployment checks
tests/                        # unit, integration and HTTP workflow verification
public/                       # original wordmark/favicon/share artwork
```

## Entity relationship design
User 1—0..1 Profile; User 1—N Session, VerificationToken, PasswordResetToken, Notification; User 1—0..1 TeamMember (unique userId enforces one team per event). Team 1—N TeamMember, TeamInvitation; Team 1—0..1 RegistrationSubmission (unique teamId), with unique registrationId. Team.leaderId references User; leadership transfer must validate membership and change both role records atomically. Event 1—N Track, ScheduleItem, Prize, FAQ, Sponsor and EventSettings. Track 1—N ProblemStatement, optional association. Announcement supports draft/published/scheduled visibility. ContactMessage stores support requests; AuditLog records sensitive operations and retains history using nullable actor references. RateLimitBucket provides shared database-backed quotas. EmailOutbox tracks delivery attempts. Cascades remove auth/profile data with an account, restrict deletion of active team leaders, and retain anonymized audit records.

Existing EventConfig is retained as a compatibility settings store. Structured content is normalized incrementally, avoiding destructive migration of organizer input.

## Page plan
Home: oversized original YANTRA AI wordmark, neural visual, real participation counts, configurable date/location/countdown, about, benefits, track notice, onboarding steps, schedule preview, awards, eligibility, partners, organizers, FAQ and contact links. Dedicated pages expand each topic. Unknown official details display “To be announced”. Proposed track categories are explicitly tentative. Draft rules never appear as official rules.
Participant dashboard: profile completion, verified-email state, team membership, registration progress, notices and deadlines. Team page: create/solo, email-bound invitations, join, rename, leave, member removal and leadership transfer with confirmations. Admin: real counts, searchable/filterable participant/team tables, status review, protected CSV, configuration, content editing, announcement publication and empty problem statement CRUD with draft/publication controls.

## API contract
JSON error responses use `{error}` and a suitable 400/401/403/404/409/429/500 status. Successful writes return `{success:true,...}`. All mutations validate Origin; all private operations read the server session and authoritative database role.

| Endpoint | Methods | Access / input |
|---|---|---|
| /api/auth/register | POST | public, email/password, rate limited |
| /api/auth/login | POST | public, email/password; cookie session |
| /api/auth/logout | POST | revoke current session |
| /api/auth/verify-email | POST | expiring single-use token |
| /api/auth/forgot-password | POST | email, uniform response |
| /api/auth/reset-password | POST | token/password, atomic consume + session revocation |
| /api/auth/resend-verification | POST | authenticated, rate limited |
| /api/profile | GET, POST | own profile, consent and safe links |
| /api/team | GET, POST | own team / verified account creates team |
| /api/team/invite | POST | leader, invited email |
| /api/team/join | POST | verified matching invitee, token |
| /api/team/manage | POST | leader, rename/kick/transfer_leader |
| /api/team/leave | POST | own membership subject to lock/deadline |
| /api/registration/submit | POST | leader, verified complete consenting members |
| /api/notifications | GET, PATCH | own notifications only |
| /api/account | DELETE | password confirmation, own data subject to team constraints |
| /api/contact | POST | public bounded fields, honeypot + rate limit |
| /api/admin/config | GET, POST | admin, validated key/value |
| /api/admin/metrics | GET | admin, database aggregates |
| /api/admin/registrations | GET, POST | admin, review transitions with reason |
| /api/admin/export | GET | admin, formula-safe CSV, audit |
| /api/admin/announcements | GET, POST, PATCH, DELETE | admin; confirmation on delete |
| /api/admin/problem-statements | GET, POST, PATCH, DELETE | admin; drafts by default |
| /api/admin/content | GET, POST, DELETE | admin, typed content entities |
| /api/admin/participants, /api/admin/teams | GET | admin, bounded search/filter |

## Roles and transitions
Visitor: public published content, account creation, login, support. Participant: own profile, own team and notifications. Leader: membership management and submission within configured bounds. Admin: review/configuration/publication/export; never inferred from client role values.
Account unverified → verified → profile complete → solo/team formed → PENDING → APPROVED or REJECTED. REJECTED may be resubmitted before deadline. PENDING/APPROVED team rosters are locked; editing resumes only after rejection, subject to deadlines. Every participant accepts the current published rules version and privacy policy. Disabled solo participation and team bounds are checked server-side. Row locks serialize joins, edits and registration submission on the same team. Secure random IDs plus database uniqueness protect registration identity.

## Security checklist
- [ ] HTTPS and production Secure cookies, HSTS, anti-framing and no-sniff headers
- [ ] Password bounds and bcrypt; hash bearer tokens at rest
- [ ] Atomic single-use token consumption; revoke sessions on reset
- [ ] Origin checks for mutating JSON APIs; no state changes via GET
- [ ] Distributed rate limiting, bounded input, no raw ORM error disclosure
- [ ] Team row locks, member uniqueness, validated leadership transfer
- [ ] Current rules/version/consents and absolute ISO deadlines enforced
- [ ] Authoritative admin checks on every read/write/export; audit changes
- [ ] React escaping and HTML email escaping; formula-safe CSV
- [ ] No secrets in tracked files; local mailbox ignored and private
- [ ] Production mail fails loudly when credentials are absent
- [ ] No arbitrary uploads; resource links use https/http only
- [ ] Account deletion and documented retention/backups

## Verification strategy
Unit tests exercise actual shared policy/validation helpers, random ID shape, CSV neutralization and token expiration. Firestore emulator integration tests use isolated fixtures, verify joins at capacity concurrently, invite email binding, leader transfer, single-use tokens, registration deadline/consent and authorization. HTTP end-to-end tests register, verify from local mail, log in, save profiles, create/join teams, submit, approve as explicit test admin, log out/in. Run typecheck, schema validation, tests and production build; report unavailable services and never call unexecuted checks passing. Browser accessibility/mobile checks are separate from server workflow checks.

## Roadmap
1. Record architecture and baseline existing implementation.
2. Correct authentication, email, authorization and transaction invariants.
3. Normalize event content, add publication, notifications and management APIs.
4. Refine public visual system and complete participant/admin interfaces.
5. Run unit/integration/HTTP workflows and production build; fix observed failures.
6. Package source and document Firebase, email, deployment, monitoring, backups and pending organizer decisions. External credentials and official event configuration are deployment prerequisites.
