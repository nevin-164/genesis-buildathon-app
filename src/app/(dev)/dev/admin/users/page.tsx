import { listClasses } from "@/controllers/admin/org.controller";
import { getAdminCounts, getUser, listUsers } from "@/controllers/admin/user.controller";

import {
  Cell,
  Empty,
  Flash,
  Go,
  Picker,
  Pill,
  Result,
  Row,
  Section,
  Table,
  Text,
  one,
  probe,
} from "../../_ui";
import {
  createUserAction,
  resetPasswordAction,
  setUserActiveAction,
  updateUserAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function DevUsersPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await props.searchParams;
  const editId = one(search.userId);

  const filters = {
    q: one(search.q),
    role: one(search.role) as "student" | "faculty" | "admin" | undefined,
    isActive: one(search.isActive) === undefined ? undefined : one(search.isActive) === "true",
    page: Number(one(search.page) ?? 1),
  };

  // Sequential — see the note in /dev/faculty.
  const counts = await probe(() => getAdminCounts());
  const users = await probe(() => listUsers(filters));
  const classes = await probe(() => listClasses());

  const editing = editId ? await probe(() => getUser(editId)) : null;

  const classOptions = classes.ok
    ? classes.value.map((c) => ({ value: c.id, label: `${c.departmentName} · ${c.name}` }))
    : [];

  return (
    <>
      <Flash ok={one(search.ok)} message={one(search.msg)} />

      <Section title="getAdminCounts()" subtitle="The two attention numbers come first for a reason.">
        <Result result={counts}>
          {(value) => (
            <div className="flex flex-wrap gap-2">
              {Object.entries(value).map(([key, n]) => {
                const attention =
                  key === "unassignedInternships" || key === "classesWithoutAdvisor";
                return (
                  <span
                    key={key}
                    className={`rounded border px-2 py-1 ${
                      attention && n > 0
                        ? "border-amber-400 bg-amber-50"
                        : "border-zinc-300 bg-zinc-50"
                    }`}
                  >
                    <span className="font-mono text-sm font-semibold">{n}</span>{" "}
                    <span className="text-[11px] text-zinc-600">{key}</span>
                  </span>
                );
              })}
            </div>
          )}
        </Result>
      </Section>

      <Section
        title="listUsers(filters)"
        subtitle="q matches name, email and register number. Filters live in the URL so a page is refreshable and shareable."
      >
        <form method="get" className="flex flex-wrap items-center gap-2">
          <Text name="q" placeholder="name, email or reg. no." defaultValue={filters.q} />
          <Picker
            name="role"
            blank="— any role —"
            defaultValue={filters.role}
            options={[
              { value: "student", label: "student" },
              { value: "faculty", label: "faculty" },
              { value: "admin", label: "admin" },
            ]}
          />
          <Picker
            name="isActive"
            blank="— any status —"
            defaultValue={filters.isActive === undefined ? "" : String(filters.isActive)}
            options={[
              { value: "true", label: "active" },
              { value: "false", label: "inactive" },
            ]}
          />
          <Text name="page" type="number" defaultValue={filters.page} />
          <Go>Search</Go>
        </form>

        <Result result={users}>
          {(value) => (
            <>
              <p className="font-mono text-[11px] text-zinc-600">
                {value.total} total · page {filters.page} of{" "}
                {Math.max(1, Math.ceil(value.total / value.pageSize))} · pageSize {value.pageSize}
              </p>
              {value.items.length === 0 ? (
                <Empty>No users match those filters.</Empty>
              ) : (
                <Table
                  head={["id", "name", "email", "role", "reg. no.", "class", "advisor", "account"]}
                >
                  {value.items.map((user) => (
                    <Row key={user.id}>
                      <Cell>
                        <a
                          className="font-mono text-[11px] text-blue-700 underline"
                          href={`/dev/admin/users?userId=${user.id}`}
                        >
                          {user.id.slice(0, 8)}
                        </a>
                      </Cell>
                      <Cell>{user.fullName}</Cell>
                      <Cell mono>{user.email}</Cell>
                      <Cell>
                        <Pill tone="mute">{user.role}</Pill>
                      </Cell>
                      <Cell mono>{user.registerNumber}</Cell>
                      <Cell mono>{user.className}</Cell>
                      <Cell>
                        {user.role === "student" ? (
                          (user.advisorName ?? <Pill tone="warn">none</Pill>)
                        ) : (
                          <span className="text-zinc-400">—</span>
                        )}
                      </Cell>
                      <Cell>
                        <form action={setUserActiveAction} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={user.id} />
                          <input
                            type="hidden"
                            name="isActive"
                            value={user.isActive ? "false" : "true"}
                          />
                          {user.isActive ? (
                            <Go tone="danger">Deactivate</Go>
                          ) : (
                            <>
                              <Pill tone="bad">inactive</Pill>
                              <Go>Activate</Go>
                            </>
                          )}
                        </form>
                      </Cell>
                    </Row>
                  ))}
                </Table>
              )}
            </>
          )}
        </Result>
      </Section>

      <Section
        title="createUser(input)"
        subtitle="student or faculty only — admin is never an option. Email and register number are unique in the database, so a duplicate returns a field error."
      >
        <form action={createUserAction} className="flex flex-wrap items-center gap-2">
          <Picker
            name="role"
            blank={null}
            options={[
              { value: "student", label: "student" },
              { value: "faculty", label: "faculty" },
            ]}
          />
          <Text name="fullName" placeholder="Full name" required />
          <Text name="email" type="email" placeholder="email@example.com" required />
          <Text name="password" placeholder="min 8 characters" required />
          <Text name="registerNumber" placeholder="reg. no. (students)" />
          <Picker name="classId" blank="— no class —" options={classOptions} />
          <Go>Create</Go>
        </form>
      </Section>

      {editing && (
        <Section
          title="getUser(id) · updateUser(id, input) · resetUserPassword(id, password)"
          subtitle="Role is shown as plain text and is not editable — a student with internships must never become faculty."
        >
          <Result result={editing}>
            {(user) => (
              <div className="space-y-3">
                <p className="text-xs">
                  Editing <strong>{user.fullName}</strong> · role{" "}
                  <Pill tone="mute">{user.role}</Pill> · created {user.createdAt.slice(0, 10)}
                </p>

                <form action={updateUserAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <Text name="fullName" defaultValue={user.fullName} required />
                  <Text name="email" type="email" defaultValue={user.email} required />
                  <Text
                    name="registerNumber"
                    defaultValue={user.registerNumber ?? ""}
                    placeholder="reg. no. (students)"
                  />
                  <Picker
                    name="classId"
                    blank="— no class —"
                    defaultValue={
                      classes.ok
                        ? classes.value.find((c) => c.name === user.className)?.id
                        : undefined
                    }
                    options={classOptions}
                  />
                  <Go>Save</Go>
                </form>

                <form action={resetPasswordAction} className="flex flex-wrap items-center gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <Text name="newPassword" placeholder="new password, min 8" required />
                  <Go tone="danger">Reset password</Go>
                  <span className="text-[11px] text-zinc-500">
                    Bumps session_version and revokes their refresh rows — they are signed out
                    everywhere.
                  </span>
                </form>
              </div>
            )}
          </Result>
        </Section>
      )}

      <Section title="no delete, anywhere" subtitle="">
        <p className="text-xs text-zinc-600">
          There is no delete function in this package and there must not be one. The business
          foreign keys are ON DELETE RESTRICT, so a user with any history physically cannot be
          removed — the database refuses. Deactivation is the only path.
        </p>
      </Section>
    </>
  );
}
