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

`0000_init` builds the ten tables; `0001_advisor_invariants` adds the two NOT
NULLs behind "every class has an advisor, every student has a class";
`0002_second_wave_auth_and_reports` adds OAuth, email verification and reports;
`0003_appeals` makes `rejected` non-terminal. The
approval-stage removal squashed the pair that came before `0000_init` rather
than stacking a migration that dropped what they built. So a database created
before that squash cannot be brought forward with `db:migrate` — reset it:

```bash
psql "$DIRECT_URL" -c 'drop schema public cascade; create schema public; drop schema if exists drizzle cascade;'
npm run db:migrate
npm run db:seed
```

**Drop `drizzle` as well as `public`, and this is the whole reason why.** The
migration ledger is `drizzle.__drizzle_migrations`, in its own schema. Dropping
only `public` takes the tables and leaves the ledger, so `drizzle-kit` still
believes every migration is applied and `db:migrate` reports success without
running anything. The result is an empty database the tool insists is
up to date.

That failure is not hypothetical, and it is worth recognising because the error
it produces points at the wrong thing. A database in that state answers every
internship query with `relation "internships" does not exist`, surfacing as a
`Failed query:` on whichever page reads the table first — usually `/faculty`,
because `getFacultyCounts()` runs `Verification.statusCounts()`. It reads like a
bug in that page. Check the schema before believing it:

```bash
psql "$DIRECT_URL" -c "\dt public.*"
```

`experiences`, `internship_applications`, `reviews` or `evidence_files` in that
list means the database predates the squash. Those four are gone from the
schema, so their presence dates the database rather than describing it.

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

There is, however, a stage **above** the advisor, and it only ever runs
backwards: a rejected student may appeal once, and an administrator rules on it.
That is not a second approval stage — nothing waits on it, and an internship
that is never rejected never touches it.

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
    ▲                        │                            ▲
    │                        ├─request_changes─▶ changes_requested
    │                        │                          │     │
    └──────────────── submit (again) ─────────────────┘     │
                             │                                │
                             └─reject──▶ rejected             │
                                            │                 │
                                     appeal │ (student, once) │
                                            ▼                 │
                                        appealed ──overturn───┘  (admin)
                                            │
                                            └──uphold──▶ rejected   (final)
```

The student may edit an internship while it is `draft` or `changes_requested`.
That list is data, not `if` chains spread across controllers — `EDITABLE_STATUSES`
plus `isEditable()` in `src/lib/validators/internship.schema.ts`.

### Appeals, and the one distinction the whole feature turns on

A rejection used to be terminal. It is not: a student may contest it **once**,
and an administrator — never the advisor who rejected it — rules on that appeal.

There are two status lists in `internship.schema.ts`, and they differ by exactly
one value:

| List | Values | Answers |
|---|---|---|
| `EDITABLE_STATUSES` | `draft`, `changes_requested` | may the write-up be changed? |
| `ATTACHABLE_STATUSES` | `draft`, `changes_requested`, **`rejected`** | may documents be added or removed? |

**A rejected student may add evidence. They may not rewrite the claim.** If
`rejected` were editable, an appeal would mean "let me change the story until
somebody agrees with it", and the administrator would be ruling on a different
internship from the one the advisor read. Adding the certificate the advisor said
was missing is the opposite: same claim, more proof. `appealed` is on neither
list — once the appeal is filed the packet is frozen, so the administrator rules
on what they were shown.

Three things follow from "the person appealed against cannot hear the appeal":

- `appeal.controller.ts` says `requireRole("admin")` with **no faculty
  fallback**. This is the one place in the app where admin is not "faculty with
  a wider scope" — everywhere else (`verification.controller`) an admin passes
  every faculty guard so they can unblock a queue. Widening these to
  `("faculty", "admin")` would let an advisor rule on their own rejection.
- `appeal.model.ts` does no faculty scoping at all, and that absence is the
  design rather than an oversight.
- There is no `/faculty` screen for appeals. The advisor learns the outcome the
  same way they learn everything else: from the verification thread on the
  student's history page.

An appeal **continues the verification thread** rather than starting a second
log — `appeal`, `uphold_appeal` and `overturn_appeal` are `verification_action`
values. The student, the advisor and the administrator all read one ordered
story, which is the point.

An overturn writes `verified_by` to the **administrator**. The Reality Card names
whoever published it, and naming the advisor who rejected it would be a lie on a
public page.

### Constraints that live in the database

Most validation is zod's job, but one rule is enforced in Postgres because a bug
in a controller must not be able to bypass it:

- `verification_events_reason_ck` — `action = 'verify' or length(btrim(reason))
  >= 10`. A reason is mandatory for `request_changes`, `reject` and `respond`,
  and it has to be an actual sentence. Checking `IS NOT NULL` alone would let a
  three-character brush-off through, which is the same as no reason at all.
  It covers the three appeal actions for free, which is why an administrator
  cannot overrule a colleague without writing down why.
- `internships_appeal_count_ck` — `appeal_count between 0 and 1`. One appeal,
  and then the decision stands. Without it an upheld rejection is the start of a
  loop rather than the end of one. Raising the cap is a migration, and it should
  be: "how many appeals do you get" is policy, not a constant to edit in passing.
- `internships_appeal_dated_ck` — an `appealed` row always has an `appealed_at`.
  The admin queue is ordered oldest-first, and an undated appeal sorts to the top
  of it forever, reading as having waited since the beginning of time.

Both appeal checks are written against `status::text` rather than the enum
value. Postgres refuses to use a new enum label in the same transaction that
added it, and drizzle-kit runs a migration inside one transaction — the cast is
what lets `0003_appeals.sql` ship the `ALTER TYPE` and the constraints that
depend on it together instead of as two migrations.

The two XOR checks that used to guard "belongs to an application or an
experience, never both" are gone with the application stage: `documents` and
`verification_events` each have a plain `NOT NULL internship_id` instead, which
says the same thing more simply.

### Who advises whom

Two invariants, both enforced by the database, and everything else follows:

```
classes.advisor_id          NOT NULL   every class has a faculty advisor
student_profiles.class_id   NOT NULL   every student is in a class
```

So resolution is one hop and it always succeeds:

```
student → student_profiles.class_id → classes.advisor_id     → 'class'
```

**Resolve once, when the internship is submitted, and write both
`assigned_faculty_id` and `assignment_source` onto the internship row. Never
recompute them.** If a class changes advisor in June, an internship submitted in
March must stay with the faculty member verifying it — otherwise a decision is
taken away mid-review and the audit trail points at someone who was never the
assignee.

`internships_assigned_when_submitted_ck` (`status = 'draft' or
assigned_faculty_id is not null`) is the third constraint, and the one that
makes "submitted with nobody to verify it" unrepresentable rather than merely
unlikely. A draft has no advisor yet; nothing past it may.

The resolver is `resolveAdvisor(studentId)` — taking a student, not an
internship, so it stays usable anywhere a student needs routing and adding a
third tier (a department-level coordinator, say) is a precedence list here
rather than a rewrite at the call sites.

#### What a handover does, and does not, do

Changing `classes.advisor_id` touches **one column and no internship**. New
submissions go to the new advisor; everything already submitted — pending,
changes-requested, verified, rejected — stays with the old one. The outgoing
advisor finishes what they started and keeps a permanent record of what they
handled; the incoming one gets a clean queue rather than a half-read backlog.

That means the two faculty screens read from different places, deliberately:

| Screen | Source | After a handover |
|---|---|---|
| "Your students" roster | live walk of `classes.advisor_id` | the **new** advisor |
| Verification queue and counts | frozen `internships.assigned_faculty_id` | the **old** advisor |

Both are right, so the dashboard captions them apart instead of adding them up.
`StudentProfiles.isAdvisedBy` admits either claim — "I advise their class" **or**
"I hold one of their internships" — which is what stops the outgoing advisor
getting a 404 clicking through from their own queue.

#### The one hole the constraints leave

Deactivating a faculty member who still advises a class would leave that class
pointing at an account that cannot sign in. `user.controller.setUserActive`
refuses until the classes are handed over. That refusal is the whole replacement
for the admin repair queue this design used to need: prevention, not cleanup.

There is no `advisor_override_id` and no per-internship assign screen. Both
existed only to patch classes with no advisor and students with no class, and
the override was what let the roster and the queue disagree about who advises
whom.

### The seed

`npm run db:seed` (`src/db/seed.ts`) **truncates all thirteen tables** and
refills them. Development databases only.

It is sized so nobody has to wait for another package to test their own screens:
all six statuses exist, every class carries an advisor, an org tree deep enough
that the registration dropdowns actually cascade, and reachable empty states — a
student with no internship, an internship with no documents, a deactivated user.
It also seeds the handover case on purpose: Priya's class belongs to Anil while
all three of her internships stay frozen to Meera, so the two faculty
populations visibly differ. It also seeds one refresh-token family with both tokens
printed in the clear, so rotation and reuse detection are testable before the
login page exists.

The second wave has fixtures of the same kind, for the same reason:

- **Email verification.** Every established account is confirmed, so the gate
  locks nobody out of a fresh database — the same thing migration `0002` does
  by backfilling. Against that, one student and one faculty member who have
  **not** confirmed, and four `email_verification_tokens` covering live,
  expired and already-used. The live links are printed at the end of the run,
  so /verify is testable with no Mailgun account and no inbox.
- **OAuth.** A Google-only account with `password_hash` **null** and a complete
  profile; a second one with no `student_profiles` row at all, which is the
  half-registered state `profileGate` holds on /onboarding; and an existing
  password account that later linked Google, which is the link-by-email case
  the callback has to get right.
- **AI report.** Two `internship_reports` rows on one internship, because the
  table is append-only and the newest row is the report; one more written by
  the no-API-key placeholder branch, which is what the rest of the team sees.
  Priya has a verified internship of her own so the screen can be opened as the
  default student — a report can only be generated from a verified record.
- **Appeals**, all three states, so every appeal screen has something on it
  before anybody drives the flow by hand. Maya's sits in the admin queue with
  the missing certificate attached *after* the rejection, which is the only way
  to see `ATTACHABLE_STATUSES` doing its job. Nikhil's was heard and upheld, so
  his page shows the "final" copy rather than a button that would 409. Aisha's
  was overturned, and is the one card on Explore whose verifier is an
  administrator. Rahul's rejection is left untouched, so there is still one you
  can appeal yourself.

Every account is seeded with the same password, printed at the end of the run —
except the two Google accounts, which have no password at all. Sign in as any of
the rest at `/login`.

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

### One policy table: `src/lib/auth/route-policy.ts`

Who may see what is declared once, as an ordered prefix list:

```ts
export const ROUTE_POLICY = [
  { prefix: "/admin",    access: { kind: "roles", roles: ["admin"] } },
  { prefix: "/faculty",  access: { kind: "roles", roles: ["faculty", "admin"] } },
  { prefix: "/student",  access: { kind: "roles", roles: ["student", "faculty", "admin"] } },
  { prefix: "/login",    access: { kind: "guest" } },
  { prefix: "/register", access: { kind: "guest" } },
  { prefix: "/",         access: { kind: "public" } },
] as const;
```

The proxy imports `isProtected()` and `isAllowed()` from it; `dal.ts` builds its
page guards from `rolesFor()`. Adding a protected area is **one row here plus one
line in `config.matcher`** — the matcher cannot be generated, because Next reads
that export statically at build time, so `proxy.ts` asserts at module scope that
the two agree, throwing in development and logging in production.

The file imports nothing but a type. The proxy runs before the React runtime
exists, so `server-only` and anything heavier would break it.

### `src/lib/auth/dal.ts`

`getSession()` is wrapped in React `cache()`, so the shell, the page and every
leaf component share one JWT verification and one row read per render. It
returns `null` rather than redirecting, because leaf components need a value.

- `requireUser()` / `requireRole(...)` — throw. Used by controllers.
- `requireStudentPage()` / `requireFacultyPage()` / `requireAdminPage()` —
  redirect. Used by pages only, and their role lists come from the policy table.
- `requireGuestPage()` — the mirror image, on `/login` and `/register`. A
  signed-in visitor goes to their own dashboard instead of a sign-in form.

`requireStudentPage()` admits faculty and admin, so staff can browse Explore.
`requireFacultyPage()` admits admin.

**A signed-in user in the wrong area is redirected to their own dashboard, not
to `/login`.** `/login` means "no valid session"; sending someone with a working
one there reads as a broken session and invites them to re-enter credentials
that already work.

---

## 6. Folder guide

```
src/
├─ proxy.ts                token rotation; reads lib/auth/route-policy.ts
├─ app/
│  ├─ layout.tsx           root shell — no auth logic
│  ├─ globals.css          Tailwind v4 theme tokens
│  ├─ (public)/            landing page
│  ├─ (auth)/              login, register, and their actions
│  ├─ (app)/               everything behind a login
│  │  ├─ layout.tsx        header + nav. NO role gating.
│  │  ├─ student/          explore, internships
│  │  ├─ faculty/          students, verifications
│  │  └─ admin/            users, org tree
│  └─ api/documents/[id]/download/route.ts   the only route handler
├─ components/
│  ├─ ui/                  shared primitives — Button, Input, Field, Badge…
│  ├─ layout/              AppShell, UserMenu, nav
│  ├─ forms/               FileUploadField and friends
│  └─ explore/ internship/ faculty/ admin/
├─ controllers/            one file per resource, admin/ for admin ones
├─ models/                 one file per table
├─ services/               advisor + assignment resolution, storage
├─ db/
│  ├─ index.ts             postgres.js + Drizzle client
│  ├─ seed.ts              dev fixtures. Own connection — see §3 and §4
│  └─ schema/              the source of truth
├─ lib/
│  ├─ auth/                cookies, jwt, password, refresh, dal, route-policy, errors
│  ├─ api/                 action-state, error mapping
│  ├─ constants/           roles and nav, option lists
│  ├─ validators/          zod schemas
│  └─ cn.ts                className joiner
└─ types/contracts.ts      the shared DTOs every layer agrees on
drizzle/                   generated SQL — hand-edit only to add a backfill
                           ahead of a constraint, as 0001 does
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
3. **Admin** — the three org levels, each class naming an advisor. Faculty
   register themselves first (they need nothing from the tree); students
   register last, because the register dropdowns read it.
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

---

## 13. Second wave — the five hardening packages

Sections 11 and 12 describe how the app was built. This section describes the
work that closes the gaps against the Genesis 2.0 Third Year track: rate
limiting, OAuth (Google only), email verification, an AI internship report, and
Docker.

The rule from §11 still holds — **only edit files in your own row** — and it now
covers files you *create* as well as files you change, because two branches
adding a file at the same path is also a conflict.

| Package | Branch | Owns |
|---|---|---|
| **A** Rate limiting | `feature/rate-limiting` | `lib/rate-limit.ts` |
| **B** OAuth (Google only) | `feature/oauth` | `lib/auth/oauth.ts`, `lib/auth/profile-gate.ts`, `app/api/auth/**`, `app/(auth)/onboarding/**`, `models/oauth-account.model.ts`, the `ProviderButtons` component in `login/LoginForm.tsx` |
| **C** Email verification | `feature/email-verification` | `services/email.service.ts`, `lib/auth/email-gate.ts`, `models/email-token.model.ts`, `app/(auth)/verify/**` |
| **D** AI report | `feature/ai-report` | `services/ai.service.ts`, `controllers/report.controller.ts`, `models/report.model.ts`, `lib/validators/report.schema.ts`, `app/(app)/student/internships/[id]/report/**`, `components/internship/ReportPanel.tsx` |
| **E** Docker & deploy | `feature/docker` | `Dockerfile`, `docker-compose.yml`, `.dockerignore`, `.github/workflows/**`, `next.config.ts` |
| *Frozen* | — | `package.json`, `package-lock.json`, `.env.example`, `drizzle/**`, `db/schema/**`, `lib/auth/gates.ts`, `lib/auth/dal.ts`, `proxy.ts`, `README.md`, this file |

### Why the frozen list is longer than last time

Everything a second package would otherwise have touched was moved into the
merge base by the seam commit, so those files are finished:

- **`package.json` / `package-lock.json`** — every dependency all five need is
  already installed. A pull request that changes the lockfile has gone wrong;
  ask for the package to be added to `main` instead.
- **`.env.example`** — every key is already listed, with a comment saying what
  happens when it is blank. Fill in the block your package owns; do not append.
- **`drizzle/**` and `db/schema/**`** — `0002_second_wave_auth_and_reports`
  carries all three schema changes. **Nobody on a feature branch runs
  `drizzle-kit generate`**, and only the schema owner runs `db:migrate`, because
  the whole team still shares one Supabase database.
- **`lib/auth/gates.ts`** — the resolver that calls both `profile-gate.ts` and
  `email-gate.ts`. Packages B and C each own one predicate; neither owns this.
- **`lib/auth/dal.ts`, `proxy.ts`, `login/actions.ts`, `register/actions.ts`,
  `api/documents/**`** — every call site is already wired to a stub.

### The seam contract

A seam file has a real signature and a body that does nothing. Its owner
replaces the body; **no other file changes when they do.** Two rules keep it
that way:

1. **Do not change a seam's signature.** `checkRateLimit` takes an options
   object and `sendVerificationEmail` takes identity rather than a URL precisely
   so they can grow without touching callers. If you genuinely need a new
   parameter, add an optional field.
2. **No drive-by edits.** Opening a shared file to reformat it, or renaming a
   variable while you are in there, re-creates every conflict the seam commit
   removed.

`src/types/contracts.ts` is the one file several packages still append to. Add
your DTOs in a labelled block at the **bottom**, never edit an existing type:
non-overlapping appends merge cleanly, edits to the same lines do not.

### Order of merge

Smallest first, so the riskiest branch rebases onto settled ground rather than
the other way round:

**E → A → C → D → B**

OAuth goes last because it is the only package that can still break sign-in for
everybody. Merge `main` into your branch every morning — **merge, never
rebase**; these branches are pushed and shared.

### Tests that must exist for this wave

1. Eleven failed sign-ins from one IP for one email → the eleventh is refused,
   and the message does not reveal whether the account exists.
2. A user whose `password_hash` is null cannot sign in with any password, and
   gets the same message as a wrong password.
3. An OAuth callback for an email that already has a password account → the
   provider row is **linked**, not a second user; `users_email_key` never fires.
4. A student with no `student_profiles` row requesting `/student` → redirected
   to `/onboarding`, not a 500 from `resolveAdvisor`.
5. A verification token replayed after `consumed_at` is set → no-op, not an
   error, and no second session.
6. Report generation on a `draft`, `submitted`, `rejected` or `appealed`
   internship → 409.
7. Report generation on somebody else's verified internship → **404, not 403**.

### Tests that must exist for appeals

1. A student appealing the same rejection twice → the second is refused, by the
   controller **and** by `internships_appeal_count_ck` if the controller is
   bypassed.
2. A student appealing somebody else's rejected internship → **404, not 403**.
3. A faculty member hitting `decideAppeal` → 403. This is the whole point of the
   feature: the person appealed against cannot hear the appeal.
4. Attaching a document to a `rejected` internship → allowed. Attaching one to an
   `appealed` internship → 409. Editing the write-up of either → 409.
5. Two administrators ruling on one appeal → the second gets 409, and the thread
   carries one ruling, not two.
6. An overturned appeal → `status = 'verified'`, `verified_by` = the
   **administrator**, `verified_at` set, and the card appears on Explore. A
   missing `verified_at` publishes a card that sorts to the bottom forever.
7. An upheld appeal → back to `rejected` with `appeal_count` still 1, and the
   student's page offers no second appeal.
