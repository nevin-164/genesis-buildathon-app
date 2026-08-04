# InternLens

> **See beyond the certificate.** — FISAT's verified internship memory.

## What it is

Internships are mandatory for engineering students, but juniors choose them
blindly. An advertisement says "AI/ML Internship, certificate provided" — it
does not say you will pay a fee to watch recorded videos and build the same
project as everyone else. Meanwhile, the seniors who know the truth graduate,
and their knowledge leaves with them.

InternLens is a verified internship-experience network for FISAT students.
Seniors record what actually happened during their internships as structured
**Reality Cards**, faculty verify each submission against evidence, and juniors
search and compare verified experiences instead of trusting promotional
descriptions. Every batch adds to the system — the next batch never starts
from zero.

## How it works

1. **A senior submits** a Reality Card: fees paid, stipend received, real work
   vs training, mentorship frequency, skills before and after, outcomes, and
   how they got in — with evidence (certificate, offer letter, project proof).
2. **Faculty verify** the submission against the evidence and approve, reject,
   or request corrections. Only verified cards become visible.
3. **Juniors explore** — search, filter, compare internships, see preparation
   roadmaps, and ask contributors questions.
4. **Contributors are rewarded**: the platform generates an internship report
   draft, resume points, viva questions, and a LinkedIn description from their
   submission — all editable.

## Key features

- **Reality Card** — facts instead of star ratings (~30 structured fields
  across basics, financials, actual work, mentorship, learning, outcome,
  suitability, and application path)
- **Faculty verification** with a private evidence vault and full audit trail
- **Before-and-after skill proof** for every experience
- **Internship comparison** that explains suitability, never a "winner"
- **Q&A with contributors**, respecting each senior's contact preference
- **AI-generated rewards** for contributors (report draft, resume points,
  viva prep)
- **Faculty analytics** — companies, fees, stipends, and skill trends across
  batches

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase Postgres |
| Authentication | Supabase Auth (roles: student / faculty / admin) |
| File storage | Supabase Storage (private evidence bucket, signed URLs) |
| AI generation | Google Gemini |
| Validation | zod |
| Charts | recharts |
| Hosting | Vercel |

## Architecture

The app follows **MVC** inside a single Next.js codebase:

- **Models** — `src/models/`: database queries, one file per table
- **Views** — `src/app/**/page.tsx` and `src/components/`: the UI
- **Controllers** — `src/app/api/**/route.ts` delegating to
  `src/controllers/`: auth checks, validation, and orchestration

The browser never talks to the database directly — every table has deny-all
Row Level Security, and all data access goes through the server, where
controllers enforce who may do what. Business logic that is not
request-shaped (AI generation, recommendation matching, comparison, file
storage) lives in `src/services/`.

```
src/app/         pages + API routes (folder path = URL)
src/controllers/ auth checks + validation + orchestration
src/models/      database queries (one file per table)
src/services/    AI, matching, comparison, storage
src/components/  reusable UI
src/lib/         Supabase clients, auth helpers, validators, constants
supabase/        SQL migration + seed
```

The full folder-by-folder guide, database schema, and setup instructions are
in [`ARCHITECTURE.md`](./ARCHITECTURE.md). Team git workflow is in
`TEAM_GUIDE.pdf`.
