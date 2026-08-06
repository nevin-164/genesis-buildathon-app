import {
  getFacultyCounts,
  getStudentHistory,
  listAssignedStudents,
} from "@/controllers/faculty.controller";
import { listVerificationQueue } from "@/controllers/verification.controller";

import { Cell, Empty, Pill, Result, Row, Section, ShortId, Table, probe } from "../_ui";

export const dynamic = "force-dynamic";

/** Amber past a week, red past two — the same thresholds package 5 renders. */
function waitTone(days: number) {
  if (days > 14) return "bad" as const;
  if (days > 7) return "warn" as const;
  return "mute" as const;
}

export default async function DevFacultyPage() {
  // Sequential on purpose. Each controller already runs its own queries, and
  // fanning pages out on top of that is what exhausted the pooler's client
  // limit. Latency does not matter in a harness; a page that loads does.
  const counts = await probe(() => getFacultyCounts());
  const students = await probe(() => listAssignedStudents());
  const queue = await probe(() => listVerificationQueue());

  // Prove the ownership check by asking for the first student the roster gave us.
  const firstStudentId = students.ok ? students.value[0]?.id : undefined;
  const history = firstStudentId ? await probe(() => getStudentHistory(firstStudentId)) : null;

  return (
    <>
      <Section
        title="getFacultyCounts()"
        subtitle="Scoped to the signed-in advisor. An admin sees the whole college instead."
      >
        <Result result={counts}>
          {(value) => (
            <div className="flex flex-wrap gap-2">
              {Object.entries(value).map(([key, n]) => (
                <span key={key} className="rounded border border-zinc-300 bg-zinc-50 px-2 py-1">
                  <span className="font-mono text-sm font-semibold">{n}</span>{" "}
                  <span className="text-[11px] text-zinc-600">{key}</span>
                </span>
              ))}
            </div>
          )}
        </Result>
      </Section>

      <Section
        title="listAssignedStudents()"
        subtitle="Walks the tree live — override wins over class advisor — so students who never submitted anything still appear."
      >
        <Result result={students}>
          {(value) =>
            value.length === 0 ? (
              <Empty>
                No students assigned. An administrator assigns them by making you the advisor of a
                class — try /dev/admin/org.
              </Empty>
            ) : (
              <Table head={["id", "name", "reg. no.", "class", "latest internship"]}>
                {value.map((student) => (
                  <Row key={student.id}>
                    <Cell>
                      <ShortId id={student.id} />
                    </Cell>
                    <Cell>{student.fullName}</Cell>
                    <Cell mono>{student.registerNumber}</Cell>
                    <Cell>{student.className}</Cell>
                    <Cell>
                      {student.internshipStatus ? (
                        <Pill tone="mute">{student.internshipStatus}</Pill>
                      ) : (
                        <Pill tone="warn">not submitted</Pill>
                      )}
                    </Cell>
                  </Row>
                ))}
              </Table>
            )
          }
        </Result>
      </Section>

      <Section
        title="listVerificationQueue()"
        subtitle="status = submitted, oldest first. documentCount of 0 is the advisor's first red flag."
      >
        <Result result={queue}>
          {(value) =>
            value.length === 0 ? (
              <Empty>Nothing waiting for verification.</Empty>
            ) : (
              <Table head={["", "student", "reg. no.", "company", "role", "waiting", "docs"]}>
                {value.map((item) => (
                  <Row key={item.id}>
                    <Cell>
                      <a
                        className="font-mono text-[11px] text-blue-700 underline"
                        href={`/dev/faculty/verify/${item.id}`}
                      >
                        open
                      </a>
                    </Cell>
                    <Cell>{item.studentName}</Cell>
                    <Cell mono>{item.registerNumber}</Cell>
                    <Cell>{item.companyName}</Cell>
                    <Cell>{item.roleTitle}</Cell>
                    <Cell>
                      <Pill tone={waitTone(item.waitingDays)}>{item.waitingDays}d</Pill>
                    </Cell>
                    <Cell>
                      <Pill tone={item.documentCount === 0 ? "warn" : "mute"}>
                        {item.documentCount}
                      </Pill>
                    </Cell>
                  </Row>
                ))}
              </Table>
            )
          }
        </Result>
      </Section>

      <Section
        title="getStudentHistory(firstStudentOnTheRoster)"
        subtitle="Throws NotFoundError — not ForbiddenError — for a student who is not yours, so probing ids tells you nothing."
      >
        {history === null ? (
          <Empty>No student on the roster to ask about.</Empty>
        ) : (
          <Result result={history}>
            {(value) => (
              <>
                <p className="text-xs">
                  <strong>{value.student.fullName}</strong>{" "}
                  <span className="font-mono text-zinc-500">{value.student.registerNumber}</span> ·{" "}
                  {value.student.className ?? "no class"}
                </p>
                {value.internships.length === 0 ? (
                  <Empty>This student has no internships yet.</Empty>
                ) : (
                  <Table head={["company", "role", "status", "submitted", "latest reason"]}>
                    {value.internships.map((item) => (
                      <Row key={item.id}>
                        <Cell>{item.companyName}</Cell>
                        <Cell>{item.roleTitle}</Cell>
                        <Cell>
                          <Pill tone="mute">{item.status}</Pill>
                        </Cell>
                        <Cell mono>{item.submittedAt?.slice(0, 10)}</Cell>
                        <Cell>{item.latestReason}</Cell>
                      </Row>
                    ))}
                  </Table>
                )}
              </>
            )}
          </Result>
        )}
      </Section>
    </>
  );
}
