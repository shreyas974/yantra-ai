# CHAD — AI & Machine Learning Hackathon Platform
> “Code. Create. Conquer.”

CHAD is a modern, high-performance web platform built for Artificial Intelligence and Machine Learning hackathons. It provides public event pages, dynamic database metrics, secure authentication, participant onboarding, team formation, collision-resistant registration workflows, and a protected administrative console.

## Tech Stack
- **Framework:** Next.js (App Router), React 19, TypeScript
- **Styling & UI:** Tailwind CSS, Framer Motion, Lucide Icons
- **Database & ORM:** PostgreSQL 17, Prisma ORM
- **Forms & Validation:** React Hook Form, Zod
- **Authentication:** Salted bcrypt password hashing, revocable sessions, expiring single-use verification/reset tokens
- **Testing:** Vitest

## Getting Started

### 1. Prerequisites
- Node.js 22+ & npm 10+
- Docker & Docker Compose / Docker CLI
- Git & OpenSSL

### 2. Environment Setup
Configure `.env` and `work/postgres.env`:
```bash
cp .env.example .env
```

### 3. Database
Start PostgreSQL in Docker:
```bash
docker start chad-postgres
# Or if creating anew:
docker run -d \
  --name chad-postgres \
  --env-file work/postgres.env \
  -p 127.0.0.1:55432:5432 \
  -v chad_pg_data:/var/lib/postgresql/data \
  postgres:17-alpine
```

Run migrations and seed default configuration:
```bash
npm run db:migrate
npm run db:seed
```

### 4. Running the Development Server
```bash
npm run dev -- --port 3000
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Running Tests
```bash
npm run typecheck
npm test
npm run build
```

### 6. Local Email Verification
In local development (`EMAIL_MODE=file`), emails are never sent externally. Instead, JSON representations of outgoing transactional messages are saved in:
```bash
work/mail/
```
Open the generated JSON file to inspect verification links or password reset tokens.

### 7. Administrator Promotion
To promote an existing verified user account to Administrator:
```bash
npm run admin:promote -- user@example.com --confirm
```
After promotion, sign in again and navigate to [http://localhost:3000/admin](http://localhost:3000/admin).

## Critical Content & Operational Rules
- **Problem Statements:** Kept completely empty until official release by the hackathon committee. Displays: *"Problem statements will be announced soon. Stay tuned!"*
- **Registration Submissions:** Remain closed until organizers publish official rules and set a registration deadline.
- **CSV Formula Neutralization:** All spreadsheet exports neutralize `=, +, -, @, \t, \r` prefixes to prevent spreadsheet command execution.
