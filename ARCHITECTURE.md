# InternLens — Architecture Guide

> **"See beyond the certificate."**
>
> After an internship a student writes up what actually happened. Their advisor
> verifies it against the documents they attach, and it gets published for the
> next batch to read.

This document explains how the codebase is organised: what goes in each folder,
what must never go in it, and how the pieces connect. Read it before writing
code.

---

## 1. Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) + React 19 + TypeScript | Frontend and backend in one codebase |
| Styling | **Tailwind v4** | No config file — theme tokens live in `src/app/globals.css` |
| Database | **Supabase Postgres** via **Drizzle ORM** | Real transactions, typed queries, generated migrations |
| Auth | **Custom** — JWT access token + rotating refresh token | Supabase Auth is *not* used |
| Passwords | **bcryptjs** | No native build step, so Vercel deploys cleanly |
| Tokens | **jose** | Works in the Node runtime that Next 16's proxy uses |
| File storage | **Supabase Storage** | Private `documents` bucket, short-lived signed URLs |
| Validation | **zod v4** | One schema validates the form and the server |
| Hosting | **Vercel** | Every request is a serverless function |

**Supabase is the database and the file host, nothing more.** We connect to its
Postgres directly with `postgres.js`; `@supabase/supabase-js` appears in exactly
one file, for Storage.

### Next.js 16 — things that differ from older versions

This is not the Next.js most tutorials describe. Check these before copying code
from anywhere, including an AI tool:

- The middleware file is **`src/proxy.ts`**, exporting `proxy()`. Not `middleware.ts`.
- **`params` and `searchParams` are Promises** — `const { id } = await params;`
- **`cookies()` and `headers()` are async.**
- Page prop types are **ambient globals** — write `props: PageProps<"/student">`.
  Importing that name is a compile error.
- **`error.tsx` receives `retry`, not `reset`.**
- **A page cannot set a cookie.** Only Server Actions and Route Handlers can.
- **A layout cannot gate a route.** It does not re-run on navigation and does not
  stop its children rendering.
- zod v4 syntax: `z.email()`, not `z.string().email()`.

---

## 2. How a request flows

### Reading a page

```
Browser: GET /student/explore
   ↓
src/proxy.ts                      valid session? rotate tokens if needed
   ↓
src/app/layout.tsx                <html>, <body>, fonts
  └─ src/app/(app)/layout.tsx     header + nav
      └─ .../explore/page.tsx     await requireStudentPage()
                                  await searchInternships(filters)
   ↓
src/controllers/explore.controller.ts    authorise, validate
   ↓
src/models/internship.model.ts           Drizzle query
   ↓
HTML
```

### Saving something

```
<form action={submitInternshipAction}>
   ↓
src/app/(app)/student/internships/actions.ts     "use server", ~10 lines
   ↓
src/controllers/internship.controller.ts         authorise → load → validate → act
   ↓
src/models/internship.model.ts                   Drizzle, inside a transaction
```

**There is no REST API.** Pages call controller functions directly; forms call
Server Actions. The one exception is `/api/documents/[id]/download`, which exists
because a file link has to be a real URL.

---

## 3. Layers

```
src/app/**        pages, layouts, actions.ts, route.ts
   ↓
src/controllers/  authorise, validate, orchestrate. Return plain data.
   ↓
src/services/     storage, advisor resolution, search
   ↓
src/models/       Drizzle queries — the ONLY layer that imports @/db
   ↓
src/db/           schema + client
```

Two rules carry the weight:

1. **Only `src/models/**` (plus `src/lib/auth/refresh.ts`) may import `@/db`.**
   One folder's import surface means a stray unauthorised query is a one-line
   review catch.
2. **`@supabase/supabase-js` may be imported by exactly one file** —
   `src/services/storage.service.ts`.

`src/db/seed.ts` is the one thing outside those rules, and deliberately so: it
imports `./schema` and opens its **own** connection rather than importing `@/db`.
It has to. `@/db` starts with `import "server-only"`, which throws outside a
React Server Component build, so a plain `tsx` script cannot use it. Do not
"tidy" that import.

Also: controllers never import React, `next/server`, or return a `Response`.
Components never import a controller, service or model. Cookie writes happen
only in `actions.ts` and `route.ts` files — controllers *return* tokens, they
never set them.

### The controller shape — always these four steps, in this order

```ts
export async function verifyInternship(internshipId: string, input: unknown) {
  // 1. AUTHORISE — role
  const actor = await requireRole("faculty", "admin");

  // 2. LOAD — before validating, because you need the row to judge
  //           both ownership and whether the transition is legal
  const row = await Internships.findById(internshipId);
  if (!row) throw new NotFoundError();

  //    OWNERSHIP — "a faculty" is not "THIS faculty"
  if (actor.role !== "admin" && row.assignedFacultyId !== actor.id)
    throw new ForbiddenError();

  // 3. VALIDATE input, then the transition
  const { action, reason } = verificationSchema.parse(input);
  if (row.status !== "submitted") throw new InvalidStateError();

  // 4. ACT — status change and its reason row in ONE transaction
}
```

**Return `NotFoundError`, not `ForbiddenError`, when someone asks for a row they
should not know exists.** A 403 confirms the row is real.

### Every state change is locked

Put the current status in the `WHERE` clause. Zero rows back means somebody
changed it first — throw `InvalidStateError` (HTTP 409), never succeed silently.

```ts
const [row] = await db.update(internships)
  .set({ status: "verified", verifiedAt: new Date(), verifiedBy: actor.id })
  .where(and(
    eq(internships.id, id),
    eq(internships.assignedFacultyId, actor.id),
    eq(internships.status, "submitted"),   // ← the lock
  ))
  .returning({ id: internships.id });

if (!row) throw new InvalidStateError("This was just changed by someone else.");
```

This is what stops a double-click publishing the same card twice.

---

## 4. Database

Schema lives in `src/db/schema/` as TypeScript and is the **single source of
truth**. `npx drizzle-kit generate` turns it into SQL in `drizzle/`. Never edit a
generated migration, and never hand-write SQL migrations alongside it.

Two connection strings:

- `DATABASE_URL` — the Supabase pooler, port **6543**, with `prepare: false`
  (transaction pooling breaks prepared statements). Used by the app.
- `DIRECT_URL` — the direct connection, port **5432**. Used by `drizzle-kit` and
  by the seed, because DDL over a pooler is unreliable.

There is **one migration**, `0000_init`. The approval-stage removal squashed the
earlier pair rather than stacking a third that dropped what the first two built.
So a database created before that squash cannot be brought forward with
`db:migrate` — reset it:

```bash
psql "$DIRECT_URL" -c 'drop schema public cascade; create schema public;'
npm run db:migrate
npm run db:seed
```

### The 10 tables

| File | Tables |
|---|---|
| `enums.ts` | 8 enums |
| `users.ts` | `users`, `auth_sessions` |
| `org.ts` | `departments`, `batches`, `classes`, `student_profiles` |
| `companies.ts` | `companies` |
| `internships.ts` | `internships` |
| `documents.ts` | `documents` |
| `verification-events.ts` | `verification_events` |

### One stage, not two — read this before writing any query

**There is no pre-internship approval stage.** Any student may start an
internship record at any time; nobody signs anything off beforehand. One
internship is one `internships` row, written by the student afterwards and
verified by their advisor.

```
student writes the internship  ──▶  submitted  ──▶  faculty verifies  ──▶  public
      + attaches documents
```

`internships` is a **standalone record**. Every fact the Reality Card needs —
company, role, dates, money, work nature, the lot — lives on that row, so it
never joins to explain itself.

If you have seen an older copy of this document or the README: an
`internship_applications` table, an `application_status` enum, an Approval
Brief and the `approve` / `request_clarification` actions all used to exist.
They are gone, not dormant. Do not re-add a column pointing at them.

### State machine

```
INTERNSHIP
  draft ─────submit─────▶ submitted ─────verify─────▶ verified   ← public
    ▲                        │
    │                        ├─request_changes─▶ changes_requested
    │                        │                          │
    └──────────────── submit (again) ─────────────────┘
                             └─reject──▶ rejected
```

The student may edit an internship while it is `draft` or `changes_requested`.
That list lives in `src/lib/constants/status.ts` as data, not as `if` chains
spread across controllers.

### Constraints that live in the database

Most validation is zod's job, but one rule is enforced in Postgres because a bug
in a controller must not be able to bypass it:

- `verification_events_reason_ck` — `action = 'verify' or length(btrim(reason))
  >= 10`. A reason is mandatory for `request_changes`, `reject` and `respond`,
  and it has to be an actual sentence. Checking `IS NOT NULL` alone would let a
  three-character brush-off through, which is the same as no reason at all.

The two XOR checks that used to guard "belongs to an application or an
experience, never both" are gone with the application stage: `documents` and
`verification_events` each have a plain `NOT NULL internship_id` instead, which
says the same thing more simply.

### Who advises whom

```
student_profiles.advisor_override_id   (admin set it directly)  → 'direct'
classes.advisor_id via student.class_id (the normal path)       → 'class'
nothing                                                          → NULL
```

**Resolve once, when the internship is submitted, and write both
`assigned_faculty_id` and `assignment_source` onto the internship row. Never
recompute them.** If a student changes class in June, an internship submitted in
March must stay with the faculty member who is verifying it — otherwise a
decision is taken away mid-review and the audit trail points at someone who was
never the assignee.

Write the resolver as `resolveAdvisor(studentId)` — taking a student, not an
internship. That keeps it reusable anywhere a student needs routing, and makes
adding a third tier (a department-level internship coordinator, say) one entry
in an ordered list rather than a rewrite:

```ts
const STRATEGIES = [
  { source: "direct", resolve: (s) => s.advisorOverrideId },   // admin set it directly
  { source: "class",  resolve: (s) => s.class?.advisorId },    // the normal path
] as const;
```

If nothing resolves, **still allow the submit** with `assigned_faculty_id = NULL`.
A student must not be blocked because an administrator has not finished setting
things up. The admin dashboard counts these and has a screen to assign one
(`assignment_source = 'manual'`).

With no application stage there is no earlier checkpoint to catch a student who
has no advisor, so `student_profiles.advisor_override_id` — a standing,
forward-looking rule — is now the admin's only *preventive* tool. Setting
`assigned_faculty_id` directly on an internship is the *repair* tool, applied one
row at a time after the fact.

### The seed

`npm run db:seed` (`src/db/seed.ts`) **truncates all ten tables** and refills
them. Development databases only.

It is sized so nobody has to wait for another package to test their own screens:
all five statuses exist, all four advisor-resolution paths (`class`, `direct`,
`manual`, unresolved), an org tree deep enough that the registration dropdowns
actually cascade, and reachable empty states — a faculty member with no
students, a student with no internship, an internship with no documents, a
deactivated user. It also seeds one refresh-token family with both tokens
printed in the clear, so rotation and reuse detection are testable before the
login page exists.

Every account is seeded with the same password, printed at the end of the run.
Sign in as any of them at `/login`.

Storage is not touched: document rows list and count correctly, but a download
404s at the bucket until you upload something through the app.

### Nothing is ever deleted

Foreign keys use `ON DELETE RESTRICT`, so a user with any history cannot be
removed — the database will refuse. Deactivation (`is_active = false`) is the
only path, and there is no delete button anywhere in the admin UI. `CASCADE` is
used only where a child is worthless without its parent: `auth_sessions`,
`student_profiles`, `batches`, `classes`, `documents`, `verification_events`.

---

## 5. Authentication

Two cookies, both `httpOnly` so JavaScript can never read them.

| | `il_at` (access) | `il_rt` (refresh) |
|---|---|---|
| Contents | Signed JWT | 32 random bytes, opaque |
| Lifetime | 15 minutes | 30 days, absolute |
| In the database? | No | Only its SHA-256 hash, in `auth_sessions` |

JWT payload is `{ sub, role, sv, sid, iat, exp }` — deliberately no name, email
or class, because those change and a stale token would serve old values for
15 minutes. **`role` in the token is a hint for the proxy's coarse redirects; the
DAL treats the database row as authoritative.**

`users.session_version` is the kill switch. Bump it on password change, role
change, deactivation or sign-out-everywhere, in the same transaction that
revokes the session rows.

### Rotation happens in `src/proxy.ts`

Each refresh token is usable once. When the access token is missing or within
120 seconds of expiry, the proxy swaps the refresh token for a fresh pair.

A token that was already used **more than 30 seconds ago** and is presented
again is treated as reuse: the whole family is revoked. Within 30 seconds it is
treated as a benign race — one click in the App Router fires several server
requests at once and they all carry the same cookie, so without that grace
window users get logged out at random while clicking around.

Two mistakes to avoid, both of which look like "login doesn't work":

1. **Write rotated cookies back onto the incoming request, not just the
   response.** `response.cookies.set()` only reaches the browser; the page
   rendering in the *same* request still reads the old token. You also need
   `request.cookies.set(...)` and `NextResponse.next({ request: { headers } })`.
2. **Build the response first, attach cookies last.** Returning a redirect early
   throws the new tokens away, so the browser replays a used refresh token and
   reuse detection logs the user out.

Also: `secure: process.env.NODE_ENV === "production"`. Hard-coding `secure: true`
makes the browser silently drop the cookie on `http://localhost`.

### Where authorisation is checked — four layers, all required

| Layer | Check | Cost of skipping |
|---|---|---|
| `src/proxy.ts` | role from the JWT vs the URL prefix | UX only — a flash of the wrong page |
| `page.tsx` | `requireXPage()`, first line | The page renders and its data reaches the browser |
| Server Action → controller | `requireRole(...)` | **Actions are public POST endpoints.** A page check does not cover them. |
| controller, after loading the row | ownership assertion | **IDOR** — faculty A acts on faculty B's student |

The last one is the one people skip.

### `src/lib/auth/dal.ts`

`getSession()` is wrapped in React `cache()`, so the shell, the page and every
leaf component share one JWT verification and one row read per render. It
returns `null` rather than redirecting, because leaf components need a value.

- `requireUser()` / `requireRole(...)` — throw. Used by controllers.
- `requireStudentPage()` / `requireFacultyPage()` / `requireAdminPage()` —
  redirect. Used by pages only.

`requireStudentPage()` also admits faculty and admin, so staff can browse
Explore. `requireFacultyPage()` admits admin.

---

## 6. Folder guide

```
src/
├─ proxy.ts                the route guard + token rotation
├─ app/
│  ├─ layout.tsx           root shell — no auth logic
│  ├─ globals.css          Tailwind v4 theme tokens
│  ├─ (public)/            landing page
│  ├─ (auth)/              login, register, and their actions
│  ├─ (app)/               everything behind a login
│  │  ├─ layout.tsx        header + nav. NO role gating.
│  │  ├─ student/          explore, internships
│  │  ├─ faculty/          students, verifications
│  │  └─ admin/            users, org tree, assignments
│  └─ api/documents/[id]/download/route.ts   the only route handler
├─ components/
│  ├─ ui/                  shared primitives — Button, Input, Field, Badge…
│  ├─ layout/              AppShell, UserMenu, nav
│  ├─ forms/               FileUploadField and friends
│  └─ explore/ internship/ faculty/ admin/
├─ controllers/            one file per resource, admin/ for admin ones
├─ models/                 one file per table
├─ services/               assignment, storage, search
├─ db/
│  ├─ index.ts             postgres.js + Drizzle client
│  ├─ seed.ts              dev fixtures. Own connection — see §3 and §4
│  └─ schema/              the source of truth
├─ lib/
│  ├─ auth/                cookies, jwt, password, refresh, dal, errors, actions
│  ├─ api/                 action-state, error mapping
│  ├─ constants/           roles, options, status
│  ├─ mock/                fake controller data. Deleted once queries are real
│  ├─ validators/          zod schemas
│  └─ cn.ts                className joiner
└─ types/contracts.ts      the shared DTOs every layer agrees on
drizzle/                   generated SQL — never hand-edit
```

Route groups — `(public)`, `(auth)`, `(app)` — **do not appear in the URL**.
`src/app/(app)/student/explore/page.tsx` serves `/student/explore`.

One entry above is the target, not the present: **`src/lib/constants/status.ts`**
does not exist yet — whoever builds the internship loop writes it.

---

## 7. File uploads

Serverless bodies are capped around 4.5 MB, so files never pass through our
functions. The browser uploads straight to Supabase Storage:

1. Server Action returns a signed upload URL and inserts a pending row.
2. Browser `PUT`s the bytes directly to Storage.
3. Server Action confirms — re-authorises, reads the object's **real** size and
   type, deletes and rejects it if the rules are broken.

**Step 3 is not optional.** Between 1 and 2 the client controls the bytes.

Rules: PDF, PNG and JPEG only, checked on the server; 10 MB maximum; private
bucket; download links live 60 seconds. Paths are
`internship/<id>/<uuid>.<ext>`, **always built server-side** — signing a
client-supplied path hands over the bucket. The user's filename goes in
`original_filename`, never in the path.

A student attaches as many documents as they like and says what each one is in
`documents.doc_type` — "Completion certificate", "Week 3 logbook", whatever they
have. That column is **free text, not an enum**: `DOCUMENT_TYPES` in
`lib/constants/options.ts` is a `<datalist>` of suggestions so the common cases
are spelled consistently, and the backend deliberately does not validate against
it. Verification is a check against what was attached, so an internship with no
documents at all is the advisor's first red flag — `QueueItem.documentCount`
surfaces it in the queue.

`getPublicUrl()` must never appear in this codebase. Add `grep -r getPublicUrl src/`
to your pre-deploy check.

Documents are readable by the owning student, their assigned faculty, and admins.
**Nothing is public, including on a published card** — the card publishes data,
not documents. An unauthorised request returns **404, not 403**.

---

## 8. Product rules that are not negotiable

These are decisions, not preferences. They are why the product is worth
building:

- **No star ratings, no company rankings, no scores, no "winner" in a
  comparison.** There is no column for one and none should be added. A single
  student's experience is not the truth about a company.
- **A reason is compulsory** when requesting changes or rejecting. Enforced in
  zod *and* in a database constraint, with a minimum length in both.
- **Faculty do not review projects or reports.** Verification is a short check
  against the attached documents.
- **Only `verified` internships are ever visible** to anyone but their author,
  their advisor and admins.
- **There is no approval gate.** Nobody has to sign off on an internship before
  a student does it. If someone asks for that feature back, it is a new
  decision, not a restored one.

---

## 9. Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase pooler, port 6543 — the app |
| `DIRECT_URL` | Supabase direct, port 5432 — `drizzle-kit` and `db:seed` |
| `AUTH_JWT_SECRET` | Signing key. Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_SUPABASE_URL` | Storage only |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage only. **Server-side, never exposed.** |
| `DOCUMENTS_BUCKET` | `documents` |

Anything with a `NEXT_PUBLIC_` prefix is bundled into browser JavaScript.
Secrets must never have it.

---

## 10. Setup

1. `npm install`
2. Create a project at supabase.com
3. Storage → create a bucket named `documents`, set to **Private**
4. Copy `.env.example` to `.env.local` and fill in the values from
   Project Settings → Database and → API. `db:seed` reads `.env` and
   `.env.local`, with a real shell variable winning over both.
5. `npm run db:migrate` then `npm run db:seed` — the seed **truncates every
   table**, so never point it at anything but a development database
6. `npm run dev`, then sign in at `/login` as any seeded account — the seed
   prints the shared password when it finishes

Changing the schema: edit `src/db/schema/`, run `npm run db:generate`, review the
generated SQL, then `npm run db:migrate`.

---

## 11. How the work is split

Six packages, each with its own detailed brief. Only edit files in your own row.

| Package | Owns |
|---|---|
| 1 Auth | `proxy.ts`, `lib/auth/**`, `app/(auth)/**`, `app/(app)/layout.tsx`, `components/ui/**`, `components/layout/**`, `models/user.model.ts`, `models/auth-session.model.ts`, `db/seed.ts` |
| 2 Backend, student | `controllers/{internship,explore,company,document}`, their models, `services/**`, `app/api/documents/**` |
| 3 Backend, faculty + admin | `controllers/{faculty,verification}`, `controllers/admin/**`, `models/{verification-event,org,student-profile}` |
| 4 Frontend, student | `app/(app)/student/**`, `components/{explore,internship}/**` |
| 5 Frontend, faculty | `app/(app)/faculty/**`, `components/faculty/**` |
| 6 Frontend, admin | `app/(app)/admin/**`, `components/admin/**` |
| *Frozen* | `db/schema/**`, `types/contracts.ts`, `lib/constants/**` |

**The rule that makes this merge:** the two backend packages write every
controller function on day one with the correct name and return type, returning
fake data. Frontend packages import those real paths from the start. When a stub
body is replaced by a real query, **no frontend file changes.**

Shared files, agreed once so they are not written twice: package 1 creates
`user.model.ts` and package 3 extends it; package 3 creates
`verification-event.model.ts` and package 2 imports it; package 4 builds
`Timeline` and `FileUploadField` and package 5 imports them.

---

## 12. Build order

Each stage ends in something you can demonstrate.

1. **Plumbing** — env parsing, database client, `users` and `auth_sessions`.
   *Done: the schema is migrated and `db:seed` fills it.*
2. **Identity** — login, register, sessions, the proxy, the shell, three
   different dashboards. *Three accounts log in and land in three places.*
3. **Admin** — users plus the three org levels and advisor assignment. This has to
   land before students can register, because the register dropdowns read the
   tree.
4. **Internship loop** — add one, the verification queue, verify, publish.
   *This is the core product.*
5. **Explore** — search, filters, detail, compare.
6. **Documents** — upload and signed download.
7. **Hardening** — the authorisation tests, empty states, error boundaries.

### Tests that must exist

1. Faculty A cannot act on faculty B's student → `ForbiddenError`.
2. A student cannot read another student's internship → `NotFoundError`.
3. An unverified internship requested by id → **404, not 403**.
4. Student B requesting student A's document → 404, and no signed URL is minted.
5. Verifying an already-verified internship → 409.
6. Rejecting with an empty or 3-character reason → refused by zod *and* by
   `verification_events_reason_ck`, which requires
   `length(btrim(reason)) >= 10`.
7. A deactivated user's next request → bounced to `/login`.
8. A refresh token replayed outside the grace window → the whole family revoked.
9. Five tabs opened at once after the access token expires → **nobody is logged
   out.**
