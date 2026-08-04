# InternLens

> **See beyond the certificate.** — FISAT's verified internship memory.

Seniors record what actually happened during their internships (**Reality
Cards**), faculty verify submissions against evidence, and juniors search and
compare verified experiences instead of trusting promotional ads. Contributors
are rewarded with AI-generated report drafts, resume points and viva questions.

📖 **Read [`ARCHITECTURE.md`](./ARCHITECTURE.md) first** — it explains every
folder, the MVC structure, the database schema and what to build next.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres, Auth,
Storage) · Google Gemini · zod · recharts · deployed on Vercel

## Quickstart

```bash
# 1. Install dependencies
npm install

# 2. Set up Supabase (free): https://supabase.com
#    - SQL Editor -> run supabase/migrations/0001_init.sql
#    - SQL Editor -> run supabase/seed.sql
#    - Storage    -> create bucket "evidence" (PRIVATE)

# 3. Environment variables
#    Copy .env.example to .env.local and fill in:
#    - Supabase keys: Project Settings -> API
#    - Gemini key:    https://aistudio.google.com (free, no card)

# 4. Run
npm run dev
# -> http://localhost:3000
```

Without `.env.local` the app still runs — auth is skipped so you can preview
every page while building UI.

### Demo faculty account

Supabase Dashboard → Authentication → Add user, then in the SQL Editor:

```sql
update profiles set role = 'faculty' where id = '<that-user-uuid>';
```

## Deploy (Vercel)

1. Push this repo to GitHub
2. Import it at https://vercel.com/new
3. Add the four env vars from `.env.example` in Project Settings
4. Deploy — every push redeploys automatically

## Where things live

```
src/app/         pages + API routes (folder path = URL)
src/controllers/ auth checks + validation + orchestration
src/models/      database queries (one file per table)
src/services/    AI generation, matching, comparison, file storage
src/components/  reusable UI
src/lib/         Supabase clients, auth helpers, validators, constants
supabase/        SQL migration + seed
```

Full explanation of every folder: [`ARCHITECTURE.md`](./ARCHITECTURE.md).
