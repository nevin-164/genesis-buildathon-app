# Admin console — what it does and how to drive it

Everything under `/admin` runs against the real database through
`src/controllers/admin/`. There is no mock data and no role bypass: an earlier
version of this document described `src/lib/mock/data.ts` and a `DEV_FAKE_ROLE`
environment variable, and both are gone.

## Getting in

```bash
npm install
# put .env.local next to package.json — DATABASE_URL, DIRECT_URL,
# AUTH_JWT_SECRET and the Supabase keys all matter now
npm run db:seed        # optional, and it TRUNCATES every table
npm run dev
```

Sign in at `/login` as the seeded administrator, `admin@example.com`. The seed
prints the shared password at the end of its run.

**That account is the only administrator, and there is no way to create
another.** The register form types its role as `"student" | "faculty"`, so a
hand-crafted POST cannot mint one either. Promotion is a deliberate act on the
database, not a dropdown.

## The set-up order, and why it is that order

```
1. faculty register themselves at /register     (needs nothing from the tree)
2. /admin/departments                           CSE, ME …
3. /admin/batches                               2022-2026 under a department
4. /admin/classes                               S6-CSE-A, naming an advisor
5. students register at /register into a class
```

Step 1 comes first because **a class cannot be saved without an advisor** and
the advisor has to be a registered faculty member. `/admin/classes` says so
directly when no faculty exist yet, rather than letting the form fail on submit.

Step 5 comes last because **a student cannot register without a class**. Until
one exists, the student half of the register form shows an amber notice and no
submit button; the faculty half still works.

Those two rules are `NOT NULL` columns, not just form validation — see
`src/db/schema/org.ts`. Together they mean a submitted internship always
resolves a reviewer, which is why there is no "unassigned internships" queue.
There used to be one.

## The screens

| Route | What it is for |
|---|---|
| `/admin` | Six counts and the set-up order. One amber tile, and only one: appeals. |
| `/admin/users` | The directory. Search by name, email or register number; filter by role, status, and for students by department → batch → class. Faculty rows show how many classes they carry. |
| `/admin/users/[id]` | Correct a name, email, register number or class. Deactivate. Reset a password for somebody locked out. |
| `/admin/departments` | Level 1. |
| `/admin/batches` | Level 2, filterable by department. |
| `/admin/classes` | Level 3 — the level that carries the advisor. |
| `/admin/classes/[id]` | One class: hand it to a different advisor, and move students in or out. |
| `/admin/appeals` | Rejections a student has contested, oldest first. The only queue an administrator owns. |
| `/admin/appeals/[id]` | Rule on one: publish over the rejection, or let it stand. |

There is **no create-user screen**. Making an account for somebody means
inventing a password and delivering it out of band, which is the problem
self-registration solves.

There is **no delete**, anywhere. The business foreign keys are
`ON DELETE RESTRICT`, so a user with any history physically cannot be removed —
the database refuses. Deactivation is the only path.

## Appeals — the one queue that is yours

A faculty rejection is not the end of the road. The student may contest it
**once**, attaching whatever the advisor said was missing, and it lands in
`/admin/appeals`. Nobody else can clear that queue, which is why it is the one
amber tile on the dashboard and why it is on the nav rather than behind a tile.

You have two options and there is deliberately no third:

- **Overturn and publish** — the card goes live on Explore immediately, and
  **you** are recorded as the verifier, not the advisor who rejected it. Needs
  the two confirmation boxes as well as your reasoning.
- **Uphold the rejection** — it goes back to `rejected` and stays there. The
  student gets no second appeal.

Both need written reasoning, which is stricter than the faculty form where
verifying needs none. You are either overruling a colleague or refusing a
student, and both are decisions somebody will ask you about later. The student
and the advisor both read what you write, on the same verification thread that
carries everything else about that internship.

"Send it back to the advisor" is the obvious third option and it is missing on
purpose: the advisor has already given their answer, so returning it there is a
loop with no new information in it. If you want their view, ask them, then rule.

**What the student can and cannot change while rejected.** They can attach more
documents. They cannot edit a single word of the write-up. So the internship you
are reading is exactly the one the advisor read — only the evidence has grown.
Once the appeal is filed, even the documents are frozen.

## Two things that will surprise you

**Deactivating a faculty member who still advises a class is refused.** The
confirmation panel tells you how many classes and stays open until you hand them
over. Without that guard the class would keep pointing at an account that cannot
sign in, and every future submission from it would route into a dead queue. This
one refusal is the entire replacement for the repair tooling this app used to
need.

**Changing a class's advisor moves nothing.** New submissions go to the new
advisor; every internship already submitted — pending, changes requested,
verified, rejected, under appeal — stays with the old one. Both class and student screens say
so where you make the change. `ARCHITECTURE.md` §4 has the reasoning.

## Dev harness

Gone. `src/app/(dev)/` was a package-3 scaffold for driving these controllers
before the real screens existed; `/admin/**` and `/faculty/**` now do it, so the
folder was deleted along with `src/models/dev-fixtures.model.ts`.

The one thing it checked that nothing else did — that `config.matcher` in
`proxy.ts` covers every role-guarded prefix in `route-policy.ts` — now runs as
an assertion at the top of `proxy.ts` itself.
