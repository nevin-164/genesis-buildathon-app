# InternLens — Architecture Guide

> **"See beyond the certificate."**
>
> A student gets their internship approved before starting it. Afterwards they
> write up what actually happened, their advisor verifies it against the
> certificate, and it gets published for the next batch to read.

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
| File storage | **Supabase Storage** | Private `evidence` bucket, short-lived signed URLs |
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
                                  await searchExperiences(filters)
   ↓
src/controllers/explore.controller.ts    authorise, validate
   ↓
src/models/experience.model.ts           Drizzle query
   ↓
HTML
```

### Saving something

```
<form action={submitApplicationAction}>
   ↓
src/app/(app)/student/application/actions.ts     "use server", ~10 lines
   ↓
src/controllers/application.controller.ts        authorise → load → validate → act
   ↓
src/models/application.model.ts                  Drizzle, inside a transaction
```

**There is no REST API.** Pages call controller functions directly; forms call
Server Actions. The one exception is `/api/evidence/[id]/download`, which exists
because a file link has to be a real URL.

---

## 3. Layers

```
src/app/**        pages, layouts, actions.ts, route.ts
   ↓
src/controllers/  authorise, validate, orchestrate. Return plain data.
   ↓
src/services/     storage, advisor resolution, search, approval brief
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

Also: controllers never import React, `next/server`, or return a `Response`.
Components never import a controller, service or model. Cookie writes happen
only in `actions.ts` and `route.ts` files — controllers *return* tokens, they
never set them.

### The controller shape — always these four steps, in this order

```ts
export async function reviewApplication(applicationId: string, input: unknown) {
  // 1. AUTHORISE — role
  const actor = await requireRole("faculty", "admin");

  // 2. LOAD — before validating, because you need the row to judge
  //           both ownership and whether the transition is legal
  const app = await Applications.findById(applicationId);
  if (!app) throw new NotFoundError();

  //    OWNERSHIP — "a faculty" is not "THIS faculty"
  if (actor.role !== "admin" && app.assignedFacultyId !== actor.id)
    throw new ForbiddenError();

  // 3. VALIDATE input, then the transition
  const { action, reason } = reviewSchema.parse(input);
  if (app.status !== "submitted") throw new InvalidStateError();

  // 4. ACT — status change and its reason row in ONE transaction
}
```

**Return `NotFoundError`, not `ForbiddenError`, when someone asks for a row they
should not know exists.** A 403 confirms the row is real.

### Every state change is locked

Put the current status in the `WHERE` clause. Zero rows back means somebody
changed it first — throw `InvalidStateError` (HTTP 409), never succeed silently.

```ts
const [row] = await db.update(internshipApplications)
  .set({ status: "approved", decidedAt: new Date() })
  .where(and(
    eq(internshipApplications.id, id),
    eq(internshipApplications.assignedFacultyId, actor.id),
    eq(internshipApplications.status, "submitted"),   // ← the lock
  ))
  .returning({ id: internshipApplications.id });

if (!row) throw new InvalidStateError("This was just changed by someone else.");
```

This is what stops a double-click producing two approvals.

---

## 4. Database

Schema lives in `src/db/schema/` as TypeScript and is the **single source of
truth**. `npx drizzle-kit generate` turns it into SQL in `drizzle/`. Never edit a
generated migration, and never hand-write SQL migrations alongside it.

Two connection strings:

- `DATABASE_URL` — the Supabase pooler, port **6543**, with `prepare: false`
  (transaction pooling breaks prepared statements). Used by the app.
- `DIRECT_URL` — the direct connection, port **5432**. Used by `drizzle-kit`,
  because DDL over a pooler is unreliable.

### The 11 tables

| File | Tables |
|---|---|
| `enums.ts` | 10 enums |
| `users.ts` | `users`, `auth_sessions` |
| `org.ts` | `departments`, `batches`, `classes`, `student_profiles` |
| `companies.ts` | `companies` |
| `applications.ts` | `internship_applications` |
| `experiences.ts` | `experiences` |
| `evidence.ts` | `evidence_files` |
| `reviews.ts` | `reviews` |

### The two-stage model — the most important thing to understand

There are **two rows per internship**, not one.

| | `internship_applications` | `experiences` |
|---|---|---|
| Filled in | Before the internship | After it |
| Holds | The plan | What actually happened |
| Evidence | Offer letter | Completion certificate |
| Faculty verb | approve / request clarification / reject | verify / request changes / reject |
| Public? | **Never** | Yes, once `status = 'verified'` |

They are linked by `experiences.application_id`, which is **UNIQUE NOT NULL**.
That one constraint enforces three rules at once: one experience per internship,
no experience without an application, and no experience without faculty
approval.

### State machines

```
APPLICATION
  draft ─────submit─────▶ submitted ─────approve─────▶ approved
    ▲                        │
    │                        ├─request_clarification─▶ clarification_requested
    │                        │                                  │
    └───────────────── submit (with reply) ────────────────────┘
                             └─reject──▶ rejected

EXPERIENCE   (only creatable once its application is 'approved')
  draft ─────submit─────▶ submitted ─────verify─────▶ verified   ← public
    ▲                        │
    │                        ├─request_changes─▶ changes_requested
    │                        │                          │
    └──────────────── submit (again) ─────────────────┘
                             └─reject──▶ rejected
```

The student may edit an application while it is `draft` or
`clarification_requested`, and an experience while it is `draft` or
`changes_requested`. These lists live in `src/lib/constants/status.ts` as data,
not as `if` chains spread across controllers.

### Constraints that live in the database

Most validation is zod's job, but four rules are enforced in Postgres because a
bug in a controller must not be able to bypass them:

- `reviews_reason_required_ck` — a reason is mandatory for every action except
  approve and verify.
- `reviews_one_owner_ck` and `evidence_one_owner_ck` — a row belongs to an
  application or an experience, never both.
- `experiences_application_key` — the unique index described above.

### Who advises whom

```
student_profiles.advisor_override_id   (admin set it directly)  → 'direct'
classes.advisor_id via student.class_id (the normal path)       → 'class'
nothing                                                          → NULL
```

**Resolve once, at submit time, and write the result onto the application. Never
recompute it.** If a student changes class in June, the application they
submitted in March must stay with the faculty member who is reviewing it —
otherwise a decision is taken away mid-review and the audit trail points at
someone who was never the assignee.

If nothing resolves, **still allow the submit** with `assigned_faculty_id = NULL`.
A student must not be blocked because an administrator has not finished setting
things up. The admin dashboard counts these and has a screen to assign one.

### Nothing is ever deleted

Foreign keys use `ON DELETE RESTRICT`, so a user with any history cannot be
removed — the database will refuse. Deactivation (`is_active = false`) is the
only path, and there is no delete button anywhere in the admin UI. `CASCADE` is
used only where a child is worthless without its parent: `auth_sessions`,
`student_profiles`, `evidence_files`, `reviews`.

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
│  │  ├─ student/          explore, application, experience
│  │  ├─ faculty/          students, applications, verifications
│  │  └─ admin/            users, org tree, assignments
│  └─ api/evidence/[id]/download/route.ts    the only route handler
├─ components/
│  ├─ ui/                  shared primitives — Button, Input, Field, Badge…
│  ├─ layout/              AppShell, UserMenu, nav
│  ├─ forms/               FileUploadField and friends
│  └─ explore/ application/ experience/ faculty/ admin/
├─ controllers/            one file per resource, admin/ for admin ones
├─ models/                 one file per table
├─ services/               assignment, storage, search, brief
├─ db/
│  ├─ index.ts             postgres.js + Drizzle client
│  └─ schema/              the source of truth
├─ lib/
│  ├─ auth/                cookies, jwt, password, refresh, dal, errors
│  ├─ api/                 action-state, error mapping
│  ├─ constants/           roles, options, status
│  └─ validators/          zod schemas
└─ types/contracts.ts      the shared DTOs every layer agrees on
drizzle/                   generated SQL — never hand-edit
```

Route groups — `(public)`, `(auth)`, `(app)` — **do not appear in the URL**.
`src/app/(app)/student/explore/page.tsx` serves `/student/explore`.

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
`application/<id>/<uuid>.pdf` or `experience/<id>/<uuid>.pdf`, **always built
server-side** — signing a client-supplied path hands over the bucket. The user's
filename goes in `original_filename`, never in the path.

`getPublicUrl()` must never appear in this codebase. Add `grep -r getPublicUrl src/`
to your pre-deploy check.

Evidence is readable by the owning student, their assigned faculty, and admins.
**Nothing is public, including on a published card** — the card publishes data,
not documents. An unauthorised request returns **404, not 403**.

---

## 8. Product rules that are not negotiable

These are decisions, not preferences. They are why the product is worth
building:

- **No star ratings, no company rankings, no scores, no "winner" in a
  comparison.** There is no column for one and none should be added. A single
  student's experience is not the truth about a company.
- **A reason is compulsory** when requesting clarification, requesting changes,
  or rejecting. Enforced in zod *and* in a database constraint.
- **Faculty do not review projects or reports.** Verification is a short
  evidence check.
- **Only `verified` experiences are ever visible** to anyone but their author,
  their advisor and admins.

---

## 9. Environment

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Supabase pooler, port 6543 — the app |
| `DIRECT_URL` | Supabase direct, port 5432 — `drizzle-kit` only |
| `AUTH_JWT_SECRET` | Signing key. Generate with `openssl rand -base64 32` |
| `NEXT_PUBLIC_SUPABASE_URL` | Storage only |
| `SUPABASE_SERVICE_ROLE_KEY` | Storage only. **Server-side, never exposed.** |
| `EVIDENCE_BUCKET` | `evidence` |

Anything with a `NEXT_PUBLIC_` prefix is bundled into browser JavaScript.
Secrets must never have it.

---

## 10. Setup

1. `npm install`
2. Create a project at supabase.com
3. Storage → create a bucket named `evidence`, set to **Private**
4. Copy `.env.example` to `.env.local` and fill in the values from
   Project Settings → Database and → API
5. `npm run db:migrate` then `npm run db:seed`
6. `npm run dev`

Changing the schema: edit `src/db/schema/`, run `npm run db:generate`, review the
generated SQL, then `npm run db:migrate`.

---

## 11. How the work is split

Six packages, each with its own detailed brief. Only edit files in your own row.

| Package | Owns |
|---|---|
| 1 Auth | `proxy.ts`, `lib/auth/**`, `app/(auth)/**`, `app/(app)/layout.tsx`, `components/ui/**`, `components/layout/**`, `models/user.model.ts`, `models/auth-session.model.ts` |
| 2 Backend, student | `controllers/{application,experience,explore,company,evidence}`, their models, `services/**`, `app/api/evidence/**` |
| 3 Backend, faculty + admin | `controllers/{faculty,application-review,experience-verification}`, `controllers/admin/**`, `models/{review,org,student-profile}` |
| 4 Frontend, student | `app/(app)/student/**`, `components/{explore,application,experience}/**` |
| 5 Frontend, faculty | `app/(app)/faculty/**`, `components/faculty/**` |
| 6 Frontend, admin | `app/(app)/admin/**`, `components/admin/**` |
| *Frozen* | `db/schema/**`, `types/contracts.ts`, `lib/constants/**` |

**The rule that makes this merge:** the two backend packages write every
controller function on day one with the correct name and return type, returning
fake data. Frontend packages import those real paths from the start. When a stub
body is replaced by a real query, **no frontend file changes.**

Shared files, agreed once so they are not written twice: package 1 creates
`user.model.ts` and package 3 extends it; package 3 creates `review.model.ts` and
package 2 imports it; package 4 builds `Timeline` and `FileUploadField` and
package 5 imports them.

---

## 12. Build order

Each stage ends in something you can demonstrate.

1. **Plumbing** — env parsing, database client, `users` and `auth_sessions`,
   seed three accounts.
2. **Identity** — login, register, sessions, the proxy, the shell, three
   different dashboards. *Three accounts log in and land in three places.*
3. **Admin** — users plus the three org levels and advisor assignment. This has to
   land before students can register, because the register dropdowns read the
   tree.
4. **Approval loop** — the application, the queue, the Approval Brief, the three
   decisions. *This is the core product.*
5. **Experience loop** — contribute, verify, publish.
6. **Explore** — search, filters, detail, compare.
7. **Evidence** — upload and signed download.
8. **Hardening** — the authorisation tests, empty states, error boundaries.

### Tests that must exist

1. Faculty A cannot act on faculty B's student → `ForbiddenError`.
2. A student cannot read another student's application → `NotFoundError`.
3. An unverified experience requested by id → **404, not 403**.
4. Student B requesting student A's evidence → 404, and no signed URL is minted.
5. Approving an already-approved application → 409.
6. Rejecting with an empty or 3-character reason → refused by zod *and* by the
   database constraint.
7. A deactivated user's next request → bounced to `/login`.
8. A refresh token replayed outside the grace window → the whole family revoked.
9. Five tabs opened at once after the access token expires → **nobody is logged
   out.**
