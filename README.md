# InternLens

> **See beyond the certificate.** — a verified internship record for one college.

## What it is

Internships are mandatory for engineering students, but juniors choose them
blindly. An advertisement says "AI/ML Internship, certificate provided" — it
does not say you will pay a fee to watch recorded videos and build the same
project as everyone else. Meanwhile the seniors who know the truth graduate,
and their knowledge leaves with them.

At the same time, faculty advisors approve those internships by scrolling
WhatsApp messages and opening thirty differently-formatted Word documents.

InternLens fixes both ends of that. A student gets their internship **approved
before they start it**. After they finish, they write up **what actually
happened**. Their advisor checks it against the certificate and publishes it,
so the next batch never starts from zero.

## How it works

One login page, three roles.

1. **A student submits an approval request** before the internship starts —
   company, role, dates, fee, stipend, expected work, offer letter.
2. **Their faculty advisor decides** from a one-screen Approval Brief: approve,
   request clarification, or reject. A reason is compulsory for the last two.
3. **The student does the internship**, then **contributes the experience** —
   the real work, the actual money, mentorship, skills before and after — with a
   completion certificate.
4. **The advisor verifies it** against the evidence and publishes it.
5. **Every student can search** published experiences on Explore.

An **administrator** builds the department → batch → class tree and sets a
faculty advisor on each class. That advisor link is what "my assigned students"
means.

## Key ideas

- **Two stages, two records.** The approval request (private, always) and the
  published experience (public once verified) are separate rows, linked one to
  one. An experience cannot exist without an approved application.
- **Facts, not ratings.** No star ratings, no company rankings, no "winner" in a
  comparison. There is no column in the database for one. A single student's
  experience is not the truth about a company.
- **Evidence stays private.** Offer letters and certificates are served only
  through short-lived signed links, to the owning student, their advisor and
  admins. The published card shows data, never documents.

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
├─ app/
│  ├─ (public)/        landing page
│  ├─ (auth)/          login, register
│  ├─ (app)/           student/, faculty/, admin/ — everything behind a login
│  └─ api/evidence/    the only route handler (file downloads)
├─ components/
│  ├─ ui/              shared primitives — Button, Input, Field, Badge…
│  └─ layout/          the signed-in shell
├─ controllers/        authorise → load → validate → act
├─ models/             Drizzle queries, one file per table
├─ services/           storage, advisor resolution, search
├─ db/schema/          the database, defined once in TypeScript
├─ lib/
│  ├─ auth/            session, guards, errors
│  ├─ constants/       dropdown options, roles, statuses
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
