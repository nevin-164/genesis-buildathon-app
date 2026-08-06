# Admin UI — running it on its own

The whole admin console runs without a database, without a login and without
any other package being finished. Everything it renders comes from
`src/lib/mock/data.ts` through the stub controllers in
`src/controllers/admin/`.

## Setup

```bash
npm install
cp .env.example .env.local     # only DEV_FAKE_ROLE matters
npm run dev
```

In `.env.local`:

```
DEV_FAKE_ROLE=admin
```

That is the only variable the admin screens read. `DATABASE_URL`,
`AUTH_JWT_SECRET` and the Supabase keys can stay empty — no admin screen opens
a connection. The switch is ignored unless `NODE_ENV=development`, so it can
never become a login bypass in a deployed build.

Then open <http://localhost:3000/admin>.

## The screens

| Route | What it shows |
|---|---|
| `/admin` | Counts, and the set-up order |
| `/admin/users` | Directory, search + role + status filters, pagination |
| `/admin/users/new` | Create an account |
| `/admin/users/[id]` | Edit, deactivate, reset password |
| `/admin/departments` | Level 1 of the org tree |
| `/admin/batches` | Level 2, filtered by department |
| `/admin/classes` | Level 3, carries the faculty advisor |
| `/admin/classes/[id]` | One class: its advisor and its students |
| `/admin/assignments` | Internships submitted with nobody to verify them |

Ids that exist in the mock data: users `s1`, `f1`, `s4`; classes `c1`, `c2`;
batches `b1`; departments `d1`, `d2`.

## What is real and what is not

Reads are real: filters, search and the department → batch → class links all
work against the mock rows, so the empty states and the filtered states can be
designed properly.

Writes are stubs. Every action validates its input, returns a normal
`ActionState` and the UI shows the message — but nothing is stored, so the row
does not appear after a create and the page re-renders unchanged. That is
expected until package 3 replaces the controller bodies.

## Where to make changes

| Want to change | Edit |
|---|---|
| A screen's layout | `src/app/(app)/admin/**/page.tsx` |
| A shared piece of UI | `src/components/admin/*` |
| The fake rows | `src/lib/mock/data.ts` |

**Do not change the controller signatures** in `src/controllers/admin/`. Those
are the contract with the backend package: when a stub body is replaced by a
real query, no file in the admin UI should have to change.

## The components

- `OrgList` + `Column<T>` — the table every org screen renders
- `InlineAddForm` — the "add a row" card above those tables
- `FilterBar` — URL-backed dropdown filters
- `UserFilterBar` — search + role + status for the users directory
- `UserTable` — the users directory
- `UserForm` — create and edit in one form
- `AdvisorSelect` — the faculty dropdown
- `ConfirmButton` — an in-page confirmation panel (not `window.confirm`)
- `ActionForm` — wraps a plain `<form>` around a `(prevState, formData)` action
