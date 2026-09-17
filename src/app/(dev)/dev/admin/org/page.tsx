import {
  getClass,
  listBatches,
  listClasses,
  listDepartments,
} from "@/controllers/admin/org.controller";
import { listFacultyOptions } from "@/controllers/admin/user.controller";

import {
  Cell,
  Empty,
  Flash,
  Go,
  Picker,
  Result,
  Row,
  Section,
  ShortId,
  Table,
  Text,
  one,
  probe,
} from "../../_ui";
import {
  createBatchAction,
  createClassAction,
  createDepartmentAction,
  moveStudentAction,
  setClassAdvisorAction,
} from "../../actions";

export const dynamic = "force-dynamic";

export default async function DevOrgPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const search = await props.searchParams;
  const departmentId = one(search.departmentId);
  const batchId = one(search.batchId);
  const classId = one(search.classId);

  // Sequential — see the note in /dev/faculty.
  const departments = await probe(() => listDepartments());
  const batches = await probe(() => listBatches(departmentId));
  const classes = await probe(() => listClasses(batchId));
  const faculty = await probe(() => listFacultyOptions());

  const detail = classId ? await probe(() => getClass(classId)) : null;

  const facultyOptions = faculty.ok
    ? faculty.value.map((f) => ({ value: f.id, label: f.fullName }))
    : [];

  return (
    <>
      <Flash ok={one(search.ok)} message={one(search.msg)} />

      <Section
        title="listDepartments() · createDepartment()"
        subtitle="Code is upper-cased and unique globally. A duplicate comes back as a field error, not a 500."
      >
        <form action={createDepartmentAction} className="flex flex-wrap items-center gap-2">
          <Text name="code" placeholder="CSE" required />
          <Text name="name" placeholder="Computer Science and Engineering" required />
          <Go>Add department</Go>
        </form>

        <Result result={departments}>
          {(value) =>
            value.length === 0 ? (
              <Empty>
                No departments. Nothing else in the app works until one exists — students choose a
                class when they register.
              </Empty>
            ) : (
              <Table head={["id", "code", "name", "batches", ""]}>
                {value.map((dept) => (
                  <Row key={dept.id}>
                    <Cell>
                      <ShortId id={dept.id} />
                    </Cell>
                    <Cell mono>{dept.code}</Cell>
                    <Cell>{dept.name}</Cell>
                    <Cell mono>{dept.batchCount}</Cell>
                    <Cell>
                      <a
                        className="text-[11px] text-blue-700 underline"
                        href={`/dev/admin/org?departmentId=${dept.id}`}
                      >
                        filter batches
                      </a>
                    </Cell>
                  </Row>
                ))}
              </Table>
            )
          }
        </Result>
      </Section>

      <Section
        title="listBatches(departmentId?) · createBatch()"
        subtitle={
          departmentId
            ? `Filtered to department ${departmentId.slice(0, 8)}. Name is unique within a department; endYear must beat startYear.`
            : "Name is unique within a department; endYear must beat startYear."
        }
      >
        <form action={createBatchAction} className="flex flex-wrap items-center gap-2">
          <Picker
            name="departmentId"
            blank="— department —"
            defaultValue={departmentId}
            options={
              departments.ok
                ? departments.value.map((d) => ({ value: d.id, label: `${d.code} · ${d.name}` }))
                : []
            }
          />
          <Text name="name" placeholder="2022-2026" required />
          <Text name="startYear" type="number" defaultValue={2022} required />
          <Text name="endYear" type="number" defaultValue={2026} required />
          <Go>Add batch</Go>
        </form>

        <Result result={batches}>
          {(value) =>
            value.length === 0 ? (
              <Empty>No batches.</Empty>
            ) : (
              <Table head={["id", "name", "department", "years", "classes", ""]}>
                {value.map((batch) => (
                  <Row key={batch.id}>
                    <Cell>
                      <ShortId id={batch.id} />
                    </Cell>
                    <Cell mono>{batch.name}</Cell>
                    <Cell>{batch.departmentName}</Cell>
                    <Cell mono>
                      {batch.startYear}–{batch.endYear}
                    </Cell>
                    <Cell mono>{batch.classCount}</Cell>
                    <Cell>
                      <a
                        className="text-[11px] text-blue-700 underline"
                        href={`/dev/admin/org?batchId=${batch.id}`}
                      >
                        filter classes
                      </a>
                    </Cell>
                  </Row>
                ))}
              </Table>
            )
          }
        </Result>
      </Section>

      <Section
        title="listClasses(batchId?) · createClass() · setClassAdvisor() · moveStudentToClass()"
        subtitle="The advisor lives here and is mandatory — advisor_id is NOT NULL, so a class always routes somewhere. Changing it never touches an internship that is already submitted."
      >
        <form action={createClassAction} className="flex flex-wrap items-center gap-2">
          <Picker
            name="batchId"
            blank="— batch —"
            defaultValue={batchId}
            options={
              batches.ok
                ? batches.value.map((b) => ({
                    value: b.id,
                    label: `${b.departmentName} · ${b.name}`,
                  }))
                : []
            }
          />
          <Text name="name" placeholder="S6-CSE-A" required />
          <Picker name="advisorId" blank="— advisor (required) —" options={facultyOptions} />
          <Go>Add class</Go>
        </form>

        <Result result={classes}>
          {(value) =>
            value.length === 0 ? (
              <Empty>No classes.</Empty>
            ) : (
              <Table head={["id", "name", "batch", "department", "students", "advisor"]}>
                {value.map((klass) => (
                  <Row key={klass.id}>
                    <Cell>
                      <a
                        className="font-mono text-[11px] text-blue-700 underline"
                        href={`/dev/admin/org?classId=${klass.id}`}
                      >
                        {klass.id.slice(0, 8)}
                      </a>
                    </Cell>
                    <Cell mono>{klass.name}</Cell>
                    <Cell mono>{klass.batchName}</Cell>
                    <Cell>{klass.departmentName}</Cell>
                    <Cell mono>{klass.studentCount}</Cell>
                    <Cell>
                      <form action={setClassAdvisorAction} className="flex items-center gap-1">
                        <input type="hidden" name="classId" value={klass.id} />
                        <Picker
                          name="advisorId"
                          blank={null}
                          defaultValue={klass.advisor.id}
                          options={facultyOptions}
                        />
                        <Go>Save</Go>
                      </form>
                    </Cell>
                  </Row>
                ))}
              </Table>
            )
          }
        </Result>
      </Section>

      {detail && (
        <Section title="getClass(id)" subtitle="ClassDetail — the row plus its students.">
          <Result result={detail}>
            {(value) => (
              <>
                <p className="text-xs">
                  {value.departmentName} / {value.batchName} / <strong>{value.name}</strong> ·
                  advisor: {value.advisor.fullName}
                </p>
                {value.students.length === 0 ? (
                  <Empty>No students in this class.</Empty>
                ) : (
                  <Table head={["id", "name", "reg. no.", "move to"]}>
                    {value.students.map((student) => (
                      <Row key={student.id}>
                        <Cell>
                          <ShortId id={student.id} />
                        </Cell>
                        <Cell>{student.fullName}</Cell>
                        <Cell mono>{student.registerNumber}</Cell>
                        <Cell>
                          {/*
                            A move, never a removal: class_id is NOT NULL. Their
                            already-submitted internships stay where they are —
                            only the next one routes to the new class's advisor.
                          */}
                          <form action={moveStudentAction} className="flex items-center gap-1">
                            <input type="hidden" name="studentId" value={student.id} />
                            <Picker
                              name="classId"
                              blank="— class —"
                              options={
                                classes.ok
                                  ? classes.value
                                      .filter((c) => c.id !== value.id)
                                      .map((c) => ({
                                        value: c.id,
                                        label: `${c.departmentName} · ${c.name}`,
                                      }))
                                  : []
                              }
                            />
                            <Go>Move</Go>
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
      )}
    </>
  );
}
