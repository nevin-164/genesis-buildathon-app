import { listUnassignedInternships } from "@/controllers/admin/assignment.controller";
import { listClasses } from "@/controllers/admin/org.controller";
import { listFacultyOptions, listUsers } from "@/controllers/admin/user.controller";

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
  ShortId,
  Table,
  one,
  probe,
} from "../../_ui";
import {
  assignInternshipAction,
  moveStudentAction,
  setAdvisorOverrideAction,
  setClassAdvisorFromAssignmentsAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function DevAssignmentsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await props.searchParams;

  // Sequential — see the note in /dev/faculty.
  const unassigned = await probe(() => listUnassignedInternships());
  const classes = await probe(() => listClasses());
  const faculty = await probe(() => listFacultyOptions());
  const students = await probe(() => listUsers({ role: "student", page: 1 }));

  const facultyOptions = faculty.ok
    ? faculty.value.map((f) => ({ value: f.id, label: f.fullName }))
    : [];
  const classOptions = classes.ok
    ? classes.value.map((c) => ({ value: c.id, label: `${c.departmentName} · ${c.name}` }))
    : [];
  const studentOptions = students.ok
    ? students.value.items.map((s) => ({
        value: s.id,
        label: `${s.fullName} · ${s.registerNumber ?? "no reg."}`,
      }))
    : [];

  const withoutAdvisor = classes.ok ? classes.value.filter((c) => !c.advisor) : [];

  return (
    <>
      <Flash ok={one(search.ok)} message={one(search.msg)} />

      <Section
        title="1 · listUnassignedInternships() → assignInternshipFaculty()"
        subtitle="Submitted, but nobody can verify them. THE REPAIR TOOL — it only ever fills an empty slot, so it cannot take an internship away from an advisor mid-review, and it writes no event row."
      >
        <Result result={unassigned}>
          {(value) =>
            value.length === 0 ? (
              <Empty>Every submitted internship has an advisor.</Empty>
            ) : (
              <Table head={["id", "student", "reg. no.", "class", "company", "submitted", "assign"]}>
                {value.map((item) => (
                  <Row key={item.internshipId}>
                    <Cell>
                      <ShortId id={item.internshipId} />
                    </Cell>
                    <Cell>{item.studentName}</Cell>
                    <Cell mono>{item.registerNumber}</Cell>
                    <Cell>{item.className ?? <Pill tone="warn">no class</Pill>}</Cell>
                    <Cell>{item.companyName}</Cell>
                    <Cell mono>{item.submittedAt.slice(0, 10)}</Cell>
                    <Cell>
                      <form action={assignInternshipAction} className="flex items-center gap-1">
                        <input type="hidden" name="internshipId" value={item.internshipId} />
                        <Picker name="facultyId" blank="— choose —" options={facultyOptions} />
                        <Go>Assign</Go>
                      </form>
                    </Cell>
                  </Row>
                ))}
              </Table>
            )
          }
        </Result>
      </Section>

      <Section
        title="2 · classes with no advisor → setClassAdvisor()"
        subtitle="PREVENTIVE. Fixing these stops future internships arriving unassigned. It does not rescue the ones already in section 1 — their advisor was frozen at submit time."
      >
        {withoutAdvisor.length === 0 ? (
          <Empty>Every class has an advisor.</Empty>
        ) : (
          <Table head={["id", "class", "batch", "department", "students", "advisor"]}>
            {withoutAdvisor.map((klass) => (
              <Row key={klass.id}>
                <Cell>
                  <ShortId id={klass.id} />
                </Cell>
                <Cell mono>{klass.name}</Cell>
                <Cell mono>{klass.batchName}</Cell>
                <Cell>{klass.departmentName}</Cell>
                <Cell mono>{klass.studentCount}</Cell>
                <Cell>
                  <form
                    action={setClassAdvisorFromAssignmentsAction}
                    className="flex items-center gap-1"
                  >
                    <input type="hidden" name="classId" value={klass.id} />
                    <Picker name="advisorId" blank="— choose —" options={facultyOptions} />
                    <Go>Set</Go>
                  </form>
                </Cell>
              </Row>
            ))}
          </Table>
        )}
      </Section>

      <Section
        title="3 · setStudentAdvisorOverride() · moveStudentToClass()"
        subtitle="The override beats the class advisor — for a student supervised by someone outside their department. Leaving the advisor blank clears it and they fall back to their class."
      >
        <form action={setAdvisorOverrideAction} className="flex flex-wrap items-center gap-2">
          <Picker name="studentId" blank="— student —" options={studentOptions} />
          <Picker name="advisorId" blank="— clear the override —" options={facultyOptions} />
          <Go>Set override</Go>
        </form>

        <form action={moveStudentAction} className="flex flex-wrap items-center gap-2">
          <Picker name="studentId" blank="— student —" options={studentOptions} />
          <Picker name="classId" blank="— remove from class —" options={classOptions} />
          <Go>Move student</Go>
        </form>

        <p className="text-[11px] text-zinc-500">
          Neither of these touches an existing internship. To see the effect, set an override then
          reload /dev/faculty as that advisor — the student appears on the roster, but their already
          submitted internships stay with whoever was resolved at submit time.
        </p>

        <Result result={students}>
          {(value) => (
            <Table head={["student", "reg. no.", "class", "resolved advisor"]}>
              {value.items.map((student) => (
                <Row key={student.id}>
                  <Cell>{student.fullName}</Cell>
                  <Cell mono>{student.registerNumber}</Cell>
                  <Cell mono>{student.className}</Cell>
                  <Cell>{student.advisorName ?? <Pill tone="warn">none</Pill>}</Cell>
                </Row>
              ))}
            </Table>
          )}
        </Result>
      </Section>
    </>
  );
}
