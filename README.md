# InternLens

> **See beyond the certificate.** — a verified internship record for one college.

## What it is

Internships are mandatory for engineering students, but juniors choose them
blindly. An advertisement says "AI/ML Internship, certificate provided" — it
does not say you will pay a fee to watch recorded videos and build the same
project as everyone else. Meanwhile the seniors who know the truth graduate,
and their knowledge leaves with them.

At the same time, faculty advisors track those internships by scrolling WhatsApp
messages and opening thirty differently-formatted Word documents.

InternLens fixes both ends of that. After an internship, a student writes up
**what actually happened**. Their advisor checks it against the documents they
attach and publishes it, so the next batch never starts from zero.

## How it works

One login page, three roles. **Students and faculty register themselves;** the
administrator account is created during setup and only ever signs in.

1. **A student adds an internship** once it is over — the real work, the actual
   money, mentorship, skills before and after, how they got in.
2. **They attach whatever backs it up** — completion certificate, logbook, offer
   letter, payslip. They label each one themselves.
3. **Their faculty advisor verifies it** against those documents: publish,
   request changes, or reject. A reason is compulsory for the last two, and the
   database enforces that it is an actual sentence.
4. **Every student can search** published internships on Explore.

**There is no approval step before the internship.** Nobody has to sign anything
off in advance; a student records what happened after the fact. This was a
deliberate removal — an earlier version of the product had it.

An **administrator** builds the department → batch → class tree, naming a faculty
advisor on every class. That advisor link is what "my assigned students" means.

The order matters and the app enforces it:

1. **Faculty register.** They need nothing from the tree.
2. **The admin builds the tree.** A class cannot be saved without an advisor,
   chosen from the faculty who have registered.
3. **Students register into a class.** No class, no account.

Which means a submitted internship always has somebody to verify it — there is
no "unassigned" state to repair, because the database will not store one.

**Changing a class's advisor only redirects what is submitted next.** Everything
already submitted stays with the advisor it went to, in every state. The
outgoing advisor finishes their reviews and keeps a record of what they handled;
the incoming one starts with a clean queue.

## Key ideas

- **One record per internship.** Written by the student, verified by their
  advisor, public only once verified. Everything the card shows lives on that
  one row.
- **Facts, not ratings.** No star ratings, no company rankings, no "winner" in a
  comparison. There is no column in the database for one. A single student's
  internship is not the truth about a company.
- **Documents stay private.** They are served only through short-lived signed
  links, to the owning student, their advisor and admins. The published card
  shows data, never documents.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · Drizzle ORM on
Supabase Postgres · zod v4 · Supabase Storage for files.

Auth is custom — JWT access token plus a rotating refresh token. **Supabase Auth
is not used.** There is no REST API: pages call controller functions directly,
and forms call Server Actions.

## Structure

```
src/
├─ proxy.ts            route guard (Next 16's name for middleware)
│                     reads lib/auth/route-policy.ts — one table saying
│                     which URL prefixes are public, guest-only or role-gated
├─ app/
│  ├─ (public)/        landing page
│  ├─ (auth)/          login, register
│  ├─ (app)/           student/, faculty/, admin/ — everything behind a login
│  └─ api/documents/   the only route handler (file downloads)
├─ components/
│  ├─ ui/              shared primitives — Button, Input, Field, Badge…
│  └─ layout/          the signed-in shell
├─ controllers/        authorise → load → validate → act
├─ models/             Drizzle queries, one file per table
├─ services/           advisor resolution, storage
├─ db/schema/          the database, defined once in TypeScript
├─ lib/
│  ├─ auth/            session, guards, route policy, errors
│  ├─ constants/       dropdown options, roles and nav
│  └─ validators/      zod schemas
└─ types/contracts.ts  the shared types every layer agrees on
drizzle/               generated SQL migrations
```

Only `src/models/**` may import the database. Only one file may import the
Supabase client, and it is for Storage.

## Running it

```bash
npm install
# put the .env.local you were given next to package.json
npm run dev
```

The database already exists on Supabase — `.env.local` connects you to it.
Nobody but the schema owner runs migrations.

`ARCHITECTURE.md` has the folder-by-folder guide, the schema and the rules that
keep the layers apart.

## Deploying to Vercel

Import the repo on Vercel and accept the detected Next.js settings — build
command, output directory and install command are all the defaults. `vercel.json`
pins functions to **bom1** (Mumbai), because the Supabase project is on
`ap-south-1` and the proxy queries the database on every guarded request; a
region mismatch puts an ocean crossing on the critical path of every page load.

### 1. Environment variables

Set these under **Settings → Environment Variables** before the first build.
`.env.example` documents every key; what changes for a deployment is below.

**Required — the build fails without them.** `lib/auth/jwt.ts` throws at import
if the secret is missing, and collecting page data evaluates that module:

| Key | Value |
| --- | --- |
| `DATABASE_URL` | Supavisor pooler, port **6543**. The client sets `prepare:false` for it. |
| `AUTH_JWT_SECRET` | `openssl rand -base64 32`. A different value from the local one logs everyone out, which is fine on a first deploy. |

**Required for anything that touches a document:**

| Key | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Also drives the CSP `connect-src` — the browser PUTs bytes straight to the signed URL. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only, never exposed. |
| `DOCUMENTS_BUCKET` | `documents` |

**Optional — each degrades to a working no-op when blank:** `UPSTASH_REDIS_REST_URL`
and `UPSTASH_REDIS_REST_TOKEN` (limiter allows everything), `GOOGLE_CLIENT_ID`
and `GOOGLE_CLIENT_SECRET` (the provider button stays disabled), the `MAILGUN_*`
block and `EMAIL_FROM` (the verification link is logged instead of mailed),
`ANTHROPIC_API_KEY` (the report generator returns a marked placeholder).

**Deliberately not set:** `DIRECT_URL` is for `drizzle-kit` only and has no
business in a runtime environment. `APP_BASE_URL` and `OAUTH_REDIRECT_BASE_URL`
can stay blank — `lib/base-url.ts` falls back to `VERCEL_PROJECT_PRODUCTION_URL`
in production and `VERCEL_URL` on a preview. Set them once a custom domain is
attached.

### 2. Google OAuth redirect URI

Google compares the redirect URI byte for byte. Add the production one to the
existing client in **APIs & Services → Credentials**, alongside the localhost
entry — do not replace it:

```
https://<your-domain>/api/auth/google/callback
```

Preview deployments get a generated hostname that cannot be registered in
advance, so Google sign-in fails there with a mismatch error. That is expected;
password sign-in still works on a preview.

### 3. Migrations

Vercel does not run them, and it should not — `drizzle-kit` is a devDependency
and concurrent builds would race each other. Run them yourself against the
**direct** connection (port 5432, not the pooler) before the deploy that needs
them:

```bash
DIRECT_URL=<direct connection string> npm run db:migrate
```

The database is shared with local development, so in practice this has already
happened.

### 4. After the first deploy

- Open DevTools and read the `Content-Security-Policy-Report-Only` violations.
  The policy is observational until Next's inline bootstrap script is
  nonce-based — `'unsafe-inline'` in `script-src` is what makes enforcing it
  pointless today.
- `output: "standalone"` in `next.config.ts` is for the Docker image. Vercel
  does its own tracing and ignores it.
