# InternLens — Architecture Guide

> **"See beyond the certificate."** — FISAT's verified internship memory.
>
> Seniors record what actually happened during their internships (Reality Cards),
> faculty verify submissions against evidence, juniors search and compare verified
> experiences instead of trusting promotional ads. Contributors are rewarded with
> AI-generated report drafts, resume points and viva questions.

This document explains **every folder in the project**: what belongs in it, what
must never go in it, and how the pieces connect. The scaffold contains **no
implementation code** — route folders hold a bare-minimum `page.tsx`, and every
other folder holds only a `.gitkeep` file (an empty file whose sole purpose is
making git keep the otherwise-empty folder when pushing). This guide tells you
what to build in each.

Written for developers coming from **Laravel/PHP** — every section includes the
Laravel equivalent.

---

## 1. Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js (App Router)** — React + TypeScript | Frontend AND backend in one codebase; zero-config deploy on Vercel |
| Styling | **Tailwind CSS** | Utility classes, no separate CSS files to manage |
| Database | **Supabase Postgres** | Free tier; relational data + SQL aggregations for faculty analytics |
| Auth | **Supabase Auth** | College-email login; roles: `student` / `faculty` / `admin` |
| File storage | **Supabase Storage** | Private `evidence` bucket — certificates visible to faculty only |
| AI | **Google Gemini** (`@google/genai`, model `gemini-2.5-flash`) | Report drafts, resume points, viva questions — server-side only |
| Validation | **zod** | One schema validates forms in the browser AND requests on the server |
| Charts | **recharts** | Faculty analytics dashboard |
| Hosting | **Vercel** | Git-push-to-deploy; every API route runs as a serverless function |

**Key constraint:** Vercel runs no always-on server (no Apache/PHP-FPM equivalent).
Every page render and API call is a small serverless function that wakes per request.

---

## 2. The big picture — how a request flows

### Page request (HTML)

```
Browser: GET /explore
   ↓
src/proxy.ts                logged in? else redirect to /login
   ↓
src/app/layout.tsx          root shell (<html>, <body>)
  └─ src/app/explore/layout.tsx     explore-area navbar
      └─ src/app/explore/page.tsx   fetches data (via models) + returns JSX
   ↓
Server renders HTML → browser shows it → React hydrates it (buttons/filters
become interactive without full page reloads)
```

### API request (JSON)

```
Browser: POST /api/experiences
   ↓
src/proxy.ts                                    session check
   ↓
src/app/api/experiences/route.ts                thin entry — exports POST()
   ↓
src/controllers/experience.controller.ts        role check + zod validation
   ↓
src/models/experience.model.ts                  actual Supabase (SQL) query
   ↓
JSON response
```

**Golden rule: the browser NEVER talks to the database directly.** Every table
has Row Level Security enabled with zero policies (deny-all), so the public anon
key can read nothing. Only server code, using the service-role key, reaches data —
and the controllers decide who may do what.

### Laravel ↔ InternLens translation table

| Laravel | InternLens |
|---|---|
| `routes/web.php` | The folder tree under `src/app/` (folder path = URL) |
| `routes/api.php` | `src/app/api/**/route.ts` |
| `app/Http/Controllers/` | `src/controllers/` |
| Eloquent models (`app/Models/`) | `src/models/` (functions wrapping Supabase queries) |
| Form Requests | `src/lib/validators/` (zod schemas) |
| `app/Services/` | `src/services/` |
| Blade views + components | `page.tsx` files + `src/components/` |
| `layouts/app.blade.php` + `@extends` | `layout.tsx` files (nested automatically) |
| Middleware + Kernel | `src/proxy.ts` |
| `database/migrations/` | `supabase/migrations/*.sql` |
| `database/seeders/` | `supabase/seed.sql` |
| `.env` | `.env.local` (copy from `.env.example`) |
| `composer.json` | `package.json` |
| `php artisan serve` | `npm run dev` |

---

## 3. Root files

| File | Purpose |
|---|---|
| `package.json` | Dependencies + scripts (`npm run dev`, `npm run build`) |
| `tsconfig.json` | TypeScript config. `@/*` maps to `src/*` — write `import x from "@/models/…"` instead of `../../models/…` |
| `next.config.ts` | Next.js config (rarely touched) |
| `postcss.config.mjs` | Tailwind wiring (don't touch) |
| `eslint.config.mjs` | Linting rules |
| `.env.example` | Template listing every env var. Copy to `.env.local` and fill in |
| `.env.local` | Your real secrets. **Gitignored — never commit** |
| `src/proxy.ts` | **You create this.** Runs before every matched request — the auth guard (see §11). Next.js 16 calls this file `proxy.ts` (older tutorials say `middleware.ts` — same thing). It goes inside `src/`, not the project root |

---

## 4. `public/` — static assets

Files served as-is from the site root: logo, favicon, images.
`public/logo.png` → available at `https://yoursite.com/logo.png`.

**Never put user uploads here** — certificates and evidence go to Supabase
Storage (private bucket), not the public folder.

*Laravel equivalent: `public/`.*

---

## 5. `supabase/` — database as code

```
supabase/
├── migrations/0001_init.sql   full schema: 8 tables, enums, indexes, RLS
└── seed.sql                   demo companies
```

Apply by pasting into **Supabase Dashboard → SQL Editor → Run** (migration first,
then seed). New schema changes = new numbered file (`0002_add_x.sql`) — never edit
an already-applied migration.

The 8 tables:

| Table | What it stores |
|---|---|
| `profiles` | One row per user (name, role, branch, year, skills). Linked 1:1 to Supabase's `auth.users`. **"Junior/senior" is not a role** — it's derived from `year_of_study`, because the same student explores in 2nd year and contributes in 4th. Roles are `student` / `faculty` / `admin` |
| `companies` | Deduplicated company list |
| `experiences` | **The Reality Card** — ~30 columns in 7 groups (basic, financial, work, mentorship, learning, outcome, suitability, application path) + a `status` lifecycle: `draft → pending → verified / rejected / needs_correction`. Only `verified` rows are shown to explorers |
| `evidence` | Uploaded proof files: storage path + `visibility` (`faculty_only` / `public`) |
| `verifications` | Audit trail — every faculty action (approve/reject/request correction) with a note |
| `questions` | Junior→contributor Q&A; answered public questions form a visible FAQ |
| `saved_experiences` | Bookmarks (student + experience pair) |
| `generated_assets` | Gemini outputs (report draft, resume points, viva questions) + the contributor's edited version |

*Laravel equivalent: `database/migrations/` + `database/seeders/`, written as raw SQL.*

---

## 6. `src/app/` — VIEWS + ROUTING (the "V" and the router)

**There is no routes file.** The folder path *is* the URL. Next.js gives special
meaning to a few **reserved filenames** — everything else in `app/` is ignored by
the router:

| Reserved file | Meaning | Laravel equivalent |
|---|---|---|
| `page.tsx` | What renders at this URL | Controller method + Blade view, merged |
| `layout.tsx` | Wrapper around every page below it | `@extends('layouts.app')` |
| `route.ts` | JSON API endpoint (no HTML) | API controller |
| `loading.tsx` | Auto spinner while a page loads | — |
| `error.tsx` | Error boundary for this subtree | — |
| `[id]/` folder | Dynamic URL parameter | `{id}` in a route |
| `(auth)/` folder | Groups routes **without** adding a URL segment | `Route::group()` without prefix |
| `src/proxy.ts` | Runs before every matched request (outside `app/`) | `app/Http/Middleware` + Kernel |

A minimal page looks like this — one **server-rendered** function that fetches
data and returns JSX (HTML-like syntax inside TypeScript):

```tsx
// src/app/explore/experience/[id]/page.tsx  →  GET /explore/experience/{id}
import { getVerifiedExperienceById } from "@/models/experience.model";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const experience = await getVerifiedExperienceById(id); // the "controller" part
  return <h1>{experience.role_title}</h1>;                // the "Blade" part
}
```

Components that need browser interactivity (forms, filter panels, buttons) start
with the line `"use client";` and live mostly in `src/components/`.

### 6.1 `src/app/` root files (already present — the boot minimum)

- `layout.tsx` — root shell: `<html>`, `<body>`, fonts, global metadata
- `page.tsx` — the public landing page (`/`)
- `globals.css` — Tailwind entry point

### 6.2 `src/app/(auth)/` — login & registration

Parentheses = route group: **no URL segment**. `(auth)/login/page.tsx` serves
`/login`, not `/auth/login`. The group exists so auth pages can share a
centered-card `layout.tsx` different from the app shell.

Files (bare placeholders created — build them out):

| File | URL | What it does |
|---|---|---|
| `(auth)/login/page.tsx` | `/login` | Email + password → `supabase.auth.signInWithPassword()` (browser client, §10) → redirect by role |
| `(auth)/register/page.tsx` | `/register` | Name, college email, branch, year, password → `supabase.auth.signUp()` → then POST `/api/profile` to create the `profiles` row |
| `(auth)/layout.tsx` | — | Create for a shared centered-card look for both pages |

### 6.3 `src/app/explore/` — the discovery area (juniors)

| File (bare placeholder created; create the layout) | URL | What it does |
|---|---|---|
| `explore/layout.tsx` | — | Navbar for the whole explore area (links: Explore, Compare, Saved) |
| `explore/page.tsx` | `/explore` | Main discovery page: search box + filters (domain, mode, paid/free, beginner-friendly) + grid of Reality Card summaries. Reads `/api/experiences?domain=…&mode=…` |
| `explore/experience/[id]/page.tsx` | `/explore/experience/{id}` | Full Reality Card: all 7 sections, before/after skills, application path, public Q&A, "ask a question" (respecting the contributor's contact preference), save button, preparation roadmap |
| `explore/compare/page.tsx` | `/explore/compare?ids=a,b,c` | 2–3 cards side by side + a **suitability explanation** (never a "winner"): *"A suits beginners; B offers real project responsibility"* |
| `explore/saved/page.tsx` | `/explore/saved` | The student's bookmarks |

### 6.4 `src/app/contribute/` — the contributor area (seniors)

| File (bare placeholder created; create the layout) | URL | What it does |
|---|---|---|
| `contribute/layout.tsx` | — | Navbar: Dashboard, Submit, My experiences |
| `contribute/page.tsx` | `/contribute` | Dashboard: submissions with status badges (draft/pending/verified/needs correction), questions received, contribution stats |
| `contribute/submit/page.tsx` | `/contribute/submit` | **The multi-step Reality Card form** (7 steps = the 7 field groups). Validate each step with the zod schema (§12). Save as `draft`, submit as `pending`. Evidence uploads via `/api/evidence` |
| `contribute/experiences/[id]/page.tsx` | `/contribute/experiences/{id}` | View/edit own submission; shows faculty correction notes if `needs_correction` |
| `contribute/assets/[experienceId]/page.tsx` | `/contribute/assets/{id}` | The reward page: buttons to generate report draft / resume points / viva questions / LinkedIn summary via `/api/generate`; editable text areas (edits saved to `generated_assets.edited_content`) |

### 6.5 `src/app/faculty/` — the verification area

| File (bare placeholder created; create the layout) | URL | What it does |
|---|---|---|
| `faculty/layout.tsx` | — | Navbar: Dashboard, Verify queue |
| `faculty/page.tsx` | `/faculty` | Analytics (recharts + `/api/analytics`): most common companies, % who paid fees, stipend trends, popular domains, skills gained |
| `faculty/verify/page.tsx` | `/faculty/verify` | Queue of `pending` submissions, oldest first |
| `faculty/verify/[id]/page.tsx` | `/faculty/verify/{id}` | Single-submission review screen — see the verification flow below |

**How faculty verification works, end to end:**

1. A contributor submits → experience `status` becomes `pending` → it appears in
   the faculty queue. It is **invisible to explorers** until verified.
2. Faculty opens `/faculty/verify/{id}`. The page shows the full Reality Card
   **plus all evidence, including `faculty_only` files** (certificate, offer
   letter). Files live in a **private** Storage bucket — the server generates
   short-lived **signed URLs** (§13, `storage.service.ts`) so faculty can view
   them; students and the public can never construct a working link.
3. Faculty cross-checks: does the certificate match the company and dates? Does
   the GitHub repo exist and belong to the student? Is the student a real,
   verified FISAT account (registered with a college email)?
4. Faculty picks one of three actions (with an optional note):
   - **Approve** → `status = verified` → card becomes publicly searchable
   - **Request correction** → `status = needs_correction` → contributor sees the
     note on their dashboard, edits, resubmits → back to `pending`
   - **Reject** → `status = rejected` (fake/unverifiable)
5. Every action is recorded in the `verifications` table — a permanent audit
   trail of who approved what, when, and why.
6. Enforcement is layered: `src/proxy.ts` blocks logged-out visitors from
   `/faculty/*` pages, and `verification.controller.ts` re-checks
   `role === 'faculty'` on the API call itself (never trust the UI alone).

### 6.6 `src/app/api/` — CONTROLLER ENTRYPOINTS

Each folder holds a `route.ts` exporting functions **named after HTTP verbs** —
the function name *is* the method. Keep them thin (parse → delegate → respond);
real logic lives in `src/controllers/`.

```ts
// src/app/api/experiences/route.ts
import { NextRequest, NextResponse } from "next/server";
import { listExperiences, createExperience } from "@/controllers/experience.controller";

export async function GET(req: NextRequest) {
  const result = await listExperiences(req.nextUrl.searchParams);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const result = await createExperience(await req.json());
  return NextResponse.json(result, { status: 201 });
}
```

Endpoints to build (the folders exist — create a `route.ts` in each):

| Folder (`src/app/api/…`) | Methods | Purpose |
|---|---|---|
| `experiences/route.ts` | GET, POST | GET: list **verified** cards with filters (domain, mode, paid, beginner…). POST: contributor creates a draft/pending submission |
| `experiences/[id]/route.ts` | GET, PATCH | Single card. PATCH: owner edits draft / needs_correction submissions |
| `experiences/[id]/questions/route.ts` | GET, POST | Q&A: list public + own questions; ask; contributor answers (PATCH here or a separate route) |
| `verify/[id]/route.ts` | POST | **Faculty only.** Body: `{ action: 'approved' \| 'rejected' \| 'correction_requested', note }` — updates status + writes audit row |
| `companies/route.ts` | GET, POST | Company list for the submit form's autocomplete; add-if-missing |
| `saved/route.ts` | GET, POST, DELETE | Bookmarks |
| `generate/route.ts` | POST | Body: `{ experienceId, type }` → calls `ai.service.ts` (Gemini) → stores + returns the asset. Owner only |
| `evidence/route.ts` | POST, GET | POST: signed **upload** URL for the private bucket. GET: signed **download** URL — faculty-only for `faculty_only` files |
| `analytics/route.ts` | GET | **Faculty only.** Aggregations for the dashboard |
| `profile/route.ts` | POST | Create/update the caller's own profile (called right after `signUp()`) |

---

## 7. `src/controllers/` — CONTROLLERS (the "C")

One file per resource. Every function does, in order:

1. **Who is calling?** — `requireRole()` from `src/lib/auth.ts`
2. **Is the input valid?** — parse with the zod schema from `src/lib/validators/`
3. **Orchestrate** — call model functions (and services), enforce business rules
   (e.g. only the owner may edit a draft; only `pending` can be verified)
4. Return plain data (the `route.ts` wraps it in a JSON response)

```ts
// src/controllers/verification.controller.ts  (shape to follow)
import { requireRole } from "@/lib/auth";
import { verifyActionSchema } from "@/lib/validators/verification";
import * as Experiences from "@/models/experience.model";
import * as Verifications from "@/models/verification.model";

export async function actOnSubmission(experienceId: string, body: unknown) {
  const faculty = await requireRole("faculty");            // 1. authorize
  const { action, note } = verifyActionSchema.parse(body); // 2. validate
  const statusMap = {
    approved: "verified",
    rejected: "rejected",
    correction_requested: "needs_correction",
  } as const;
  await Experiences.updateStatus(experienceId, statusMap[action]); // 3. orchestrate
  await Verifications.record(experienceId, faculty.id, action, note);
  return { ok: true };
}
```

Files to create: `experience.controller.ts` (also owns bookmarks),
`verification.controller.ts`, `question.controller.ts`,
`company.controller.ts`, `generation.controller.ts`, `analytics.controller.ts`,
`evidence.controller.ts`, `profile.controller.ts`.

**Never** import controllers into browser components — server only.

*Laravel equivalent: `app/Http/Controllers/` + Form Request validation.*

---

## 8. `src/models/` — MODELS (the "M")

One file per table. Each exports plain async functions wrapping Supabase queries
using the **admin (service-role) client** — the only layer that touches the
database. No auth checks here (controllers did that); just data in, data out.

```ts
// src/models/experience.model.ts  (shape to follow)
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function listVerified(filters: { domain?: string; mode?: string }) {
  let query = supabaseAdmin
    .from("experiences")
    .select("*, companies(name)")
    .eq("status", "verified")
    .order("created_at", { ascending: false });

  if (filters.domain) query = query.eq("domain", filters.domain);
  if (filters.mode) query = query.eq("mode", filters.mode);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function updateStatus(id: string, status: string) {
  const { error } = await supabaseAdmin
    .from("experiences")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}
```

Files to create: `experience.model.ts`, `profile.model.ts`,
`company.model.ts`, `question.model.ts`, `verification.model.ts`,
`evidence.model.ts`, `savedExperience.model.ts`, `generatedAsset.model.ts`.

*Laravel equivalent: Eloquent models — but as query functions, not classes.*

---

## 9. `src/services/` — business logic that isn't request-shaped

| File to create | What it does |
|---|---|
| `ai.service.ts` | All Gemini calls + prompt templates (below) |
| `matching.service.ts` | Explorer profile (branch, skills, interests, budget) → scored list of recommended experiences. Start simple: filter by domain match + beginner_friendly + paid preference, rank by skill overlap |
| `comparison.service.ts` | Takes 2–3 cards → produces the suitability explanation (rule-based first; optionally Gemini later) |
| `storage.service.ts` | Signed upload/download URLs for the private `evidence` bucket (`createSignedUploadUrl` / `createSignedUrl` with a short expiry, e.g. 300 s) |

```ts
// src/services/ai.service.ts  (shape to follow — SERVER ONLY)
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateAsset(
  type: "report_draft" | "resume_points" | "viva_questions" | "linkedin_summary",
  experience: Record<string, unknown>,
) {
  const prompts = {
    report_draft:
      "Write a college internship report DRAFT with sections: company introduction, objectives, work completed, technologies used, project details, challenges, learning outcomes, conclusion. Label it clearly as a draft pending faculty format approval.",
    resume_points:
      "Write 3-5 professional resume bullet points (action verb + technology + outcome). No exaggeration — only what the data supports.",
    viva_questions:
      "Generate 8-10 likely viva questions with short model answers, covering personal contribution, technology choices, architecture, testing and improvements.",
    linkedin_summary:
      "Write a first-person LinkedIn experience description, 3-4 sentences, professional but natural.",
  };

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${prompts[type]}\n\nInternship data (JSON):\n${JSON.stringify(experience)}`,
  });
  return response.text;
}
```

Get a free `GEMINI_API_KEY` at https://aistudio.google.com (no card required).
The key must **never** appear in browser code — only this server-side service
uses it, and generated text is always editable by the contributor.

*Laravel equivalent: `app/Services/`.*

---

## 10. `src/lib/` — shared plumbing

### `src/lib/supabase/` — the three clients (create these first)

| File to create | Used from | Key | Purpose |
|---|---|---|---|
| `client.ts` | Browser (`"use client"` components) | anon | Login/register/logout ONLY — RLS blocks all data access |
| `server.ts` | Server components / route handlers | anon + cookies | Reading the logged-in user's session (`@supabase/ssr`'s `createServerClient`) |
| `admin.ts` | **Models only** | service-role | The only client that can read/write data (bypasses RLS) |

```ts
// src/lib/supabase/admin.ts  (shape to follow — SERVER ONLY)
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // no NEXT_PUBLIC_ prefix — server only
  { auth: { persistSession: false } },
);
```

### `src/lib/auth.ts` — session helpers (to create)

Build these functions, used by every controller and protected page:

- `getSessionProfile()` — reads the Supabase session (server client), loads the
  matching `profiles` row, returns it or `null`
- `requireUser()` — throws 401 unless signed in
- `requireRole(...roles)` — throws 401/403 unless signed in with a listed role
  (admin passes any faculty check)

Also create `src/lib/api.ts` with `errorResponse(e)` — maps auth errors and zod
validation errors to the right HTTP status in every route handler's `catch`.

### `src/lib/validators/` — zod schemas (Laravel Form Requests)

One file per resource: `experience.ts` (the big one — mirror the 7 field groups,
e.g. `fee_amount` required when `paid_fee` is true), `question.ts`,
`verification.ts`, `profile.ts`. Used twice: client-side in forms for instant
errors, server-side in controllers as the security gate. One schema, both places.

### `src/lib/constants.ts`

Single source of truth for dropdown options and enum labels: branches, domains,
modes, mentor frequencies, application channels… If a value is shown in a
`<select>`, it lives here — never hard-code options inside components.

---

## 11. `src/proxy.ts` — the gatekeeper (to create)

Runs before every matched request — this is Laravel middleware. (Next.js 16
renamed the file convention from `middleware.ts` to `proxy.ts`; older tutorials
use the old name.) Build it to:

1. Refresh the Supabase session cookie (`@supabase/ssr` pattern)
2. Redirect logged-out visitors on `/explore`, `/contribute`, `/faculty` to `/login`
3. Optionally no-op when Supabase env vars aren't set yet, so the team can
   preview the UI before configuring the database

Role checks (student vs faculty) happen in controllers via `requireRole()` —
middleware handles *redirects*, controllers are the security gate. Defense in
depth; never trust the UI layer alone.

---

## 12. `src/components/` — reusable UI (Blade components)

Only reusable pieces — page-specific markup stays in its `page.tsx`. Components
needing interactivity start with `"use client";`.

| Subfolder | Build here |
|---|---|
| `ui/` | Primitives: `Button`, `Input`, `Select`, `Badge` (status colors), `Card`, `Modal`, `Tabs` |
| `reality-card/` | `RealityCardSummary` (grid item), `RealityCardFull` (7 sections), `BeforeAfterSkills`, `StatusBadge`, `FinancialBlock`, `MentorshipBlock`… |
| `forms/` | The multi-step submit form: `StepBasics`, `StepFinancial`, `StepWork`, `StepMentorship`, `StepLearning`, `StepOutcome`, `StepApplicationPath`, `StepEvidence`, plus a `Stepper` |
| `charts/` | recharts wrappers for faculty analytics: `TopCompaniesChart`, `FeeVsStipendChart`, `DomainTrendsChart` |
| `layout/` | `Navbar`, `RoleShell` (sidebar + content used by the three area layouts), `Footer` |

---

## 13. `src/types/` — shared TypeScript definitions

- `index.ts` — create it with the interfaces used everywhere: `Profile`,
  `RealityCard` (~30 typed fields), `Evidence`, `Question`, `GeneratedAsset`,
  plus union types mirroring the SQL enums (`ExperienceStatus`, `WorkMode`, …).
  Keep names in sync with column names in `0001_init.sql`.
- `database.ts` — optional: auto-generated DB types
  (`npx supabase gen types typescript`) for fully typed queries.

---

## 14. Environment variables

| Variable | Where visible | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Public key — RLS makes it harmless |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** | Bypasses RLS — models only. Leaking this = leaking the DB |
| `GEMINI_API_KEY` | **Server only** | AI generation |

Rule: `NEXT_PUBLIC_` prefix = bundled into browser JS. Secrets must never have it.

---

## 15. Setup — from zero to running

1. `npm install`
2. Create a project at https://supabase.com (free)
3. SQL Editor → run `supabase/migrations/0001_init.sql`, then `supabase/seed.sql`
4. Storage → create bucket `evidence`, **Private**
5. Copy `.env.example` → `.env.local`; fill keys from Project Settings → API
6. Get a Gemini key at https://aistudio.google.com → add to `.env.local`
7. `npm run dev` → http://localhost:3000
8. Demo faculty: Dashboard → Authentication → Add user, then in SQL Editor:
   `update profiles set role = 'faculty' where id = '<uuid>';`

**Deploy:** push to GitHub → import at https://vercel.com → add the four env
vars in Project Settings → deploy. Every push = automatic redeploy.

## 16. Suggested build order

1. **Supabase setup** — create the project, run the migration + seed, create the private `evidence` bucket, fill `.env.local` (§15)
2. **Plumbing** — `lib/supabase/*`, `lib/auth.ts`, `types/index.ts`, `lib/constants.ts`, the proxy
3. **Auth** — login/register forms calling Supabase (`"use client"` + `@/lib/supabase/client`) and POST `/api/profile`
4. **Core loop** — submit form (even single-page at first) → `pending` → faculty queue → approve → visible in `/explore`. *Demo-able product here.*
5. **Reality Card UI** — full card view + working filters on `/explore`
6. **The reward** — `ai.service.ts` + the `/contribute/assets/[id]` page calling POST `/api/generate`
7. **Differentiators** — compare, saved, Q&A, before/after skills, analytics charts
8. **Polish** — matching/recommendations, prep roadmap, landing page
