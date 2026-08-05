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

There is one login page and three roles.

1. **A student submits an approval request** before the internship starts —
   company, role, dates, mode, fee, stipend, expected work, offer letter.
2. **Their assigned faculty advisor decides** from a one-screen Approval Brief:
   approve, request clarification, or reject. A reason is compulsory for the
   last two.
3. **The student does the internship**, then **contributes the experience** —
   what the work really was, the actual money, mentorship, skills before and
   after, how they got in — with a completion certificate.
4. **The advisor verifies it** against the evidence and publishes it.
5. **Every student can search** published experiences on Explore.

An **administrator** makes this possible: they build the department → batch →
class tree and set a faculty advisor on each class. That advisor link is what
"my assigned students" means.

## Key ideas

- **Two stages, two records.** The approval request (private, always) and the
  published experience (public once verified) are separate rows, linked one to
  one. An experience cannot exist without an approved application.
- **Facts, not ratings.** There is no star rating, no company ranking and no
  "winner" in a comparison — by design, and there is no column in the database
  for one. A single student's experience is not the truth about a company.
- **Evidence stays private.** Offer letters and certificates live in a private
  bucket and are only ever served through short-lived signed links, to the
  owning student, their advisor and admins. The published card shows *data*,
  never documents.
- **Faculty review evidence, not projects.** Verification is a short check that
  the internship happened and the write-up is fit to publish — not a marking
  exercise.

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS v4 (no config file — theme lives in `globals.css`) |
| Database | Supabase Postgres, accessed with Drizzle ORM over `DATABASE_URL` |
| Authentication | Custom — JWT access token + rotating refresh token, bcrypt passwords |
| File storage | Supabase Storage (private `evidence` bucket, signed URLs) |
| Validation | zod v4 |
| Hosting | Vercel |

Supabase is the database and file host. **Supabase Auth is not used** — sessions
are handled in the app.

## Getting started

```bash
npm install
cp .env.example .env.local        # then fill it in — see ARCHITECTURE.md §9
npm run db:migrate                # create the tables
npm run db:seed                   # org tree, demo users, demo data
npm run dev                       # http://localhost:3000
```

You need a Supabase project for the Postgres connection strings and a Storage
bucket named `evidence`, set to **private**.

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run db:generate` | Regenerate SQL after editing `src/db/schema/` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Browse the database |

## Structure

```
src/app/(public)/   landing page
src/app/(auth)/     login, register
src/app/(app)/      student/, faculty/, admin/ — everything behind a login
src/controllers/    authorise, validate, orchestrate
src/models/         Drizzle queries, one file per table
src/services/       storage, advisor resolution, search, approval brief
src/components/     UI
src/db/             Drizzle schema and client
src/lib/            auth, validators, constants
src/proxy.ts        the route guard (Next 16's name for middleware)
drizzle/            generated SQL migrations
```

The folder-by-folder guide, the database schema and the rules that keep the
layers apart are in [`ARCHITECTURE.md`](./ARCHITECTURE.md).
