import { getVerificationDetail } from "@/controllers/verification.controller";

import { Cell, Flash, Pill, Result, Row, Section, Table, one, probe } from "../../../_ui";
import { verifyAction } from "../../../actions";

export const dynamic = "force-dynamic";

const CONFIRMATIONS = [
  ["confirmIdentity", "This student really completed this internship"],
  ["confirmEvidence", "I have seen the attached documents"],
  ["confirmNoPrivateInfo", "No private information (phone, address, ID numbers) is included"],
] as const;

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2 text-xs">
      <span className="w-32 shrink-0 text-zinc-500">{label}</span>
      <span>{value ?? "—"}</span>
    </div>
  );
}

function money(amount: number | null) {
  if (amount === null) return <span className="text-zinc-500">not disclosed</span>;
  if (amount === 0) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}

export default async function DevVerifyPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // In Next 16 both of these are Promises.
  const { id } = await props.params;
  const search = await props.searchParams;

  const detail = await probe(() => getVerificationDetail(id));

  return (
    <>
      <Flash ok={one(search.ok)} message={one(search.msg)} />

      <p className="text-xs">
        <a className="text-blue-700 underline" href="/dev/faculty">
          ← back to the queue
        </a>
      </p>

      <Result result={detail}>
        {(value) => (
          <>
            <Section
              title="getVerificationDetail(id)"
              subtitle={`${value.student.fullName} · ${value.student.registerNumber} · ${value.student.className ?? "no class"}`}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Fact label="status" value={<Pill tone="mute">{value.internship.status}</Pill>} />
                  <Fact label="company" value={value.internship.companyName} />
                  <Fact label="role" value={value.internship.roleTitle} />
                  <Fact label="domain" value={value.internship.domain} />
                  <Fact
                    label="mode"
                    value={`${value.internship.workMode}${value.internship.location ? ` · ${value.internship.location}` : ""}`}
                  />
                  <Fact
                    label="dates"
                    value={`${value.internship.startDate} → ${value.internship.endDate} (${value.internship.durationWeeks}w)`}
                  />
                  <Fact label="student pays" value={money(value.internship.feeAmount)} />
                  <Fact label="stipend" value={money(value.internship.stipendAmount)} />
                </div>
                <div className="space-y-1">
                  <Fact label="work nature" value={value.internship.workNature} />
                  <Fact label="project" value={value.internship.projectTitle} />
                  <Fact
                    label="mentor"
                    value={
                      value.internship.hadMentor
                        ? `yes · ${value.internship.mentorFrequency ?? "unspecified"}`
                        : "no"
                    }
                  />
                  <Fact label="skills after" value={value.internship.skillsAfter.join(", ")} />
                  <Fact label="technologies" value={value.internship.technologies.join(", ")} />
                  <Fact label="got in via" value={value.internship.applicationSource} />
                  <Fact label="advisor" value={value.internship.facultyName} />
                  <Fact
                    label="can edit / submit"
                    value={`${value.internship.canEdit} / ${value.internship.canSubmit}`}
                  />
                </div>
              </div>
              <p className="rounded bg-zinc-50 p-2 text-xs text-zinc-700">
                {value.internship.workSummary}
              </p>
            </Section>

            <Section
              title="documents"
              subtitle="Read-only here. Uploads and signed downloads are package 2's."
            >
              {value.internship.documents.length === 0 ? (
                <p className="rounded border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  Nothing attached. That is the first thing a verifier should notice.
                </p>
              ) : (
                <Table head={["type", "filename", "size", "url"]}>
                  {value.internship.documents.map((doc) => (
                    <Row key={doc.id}>
                      <Cell>{doc.docType}</Cell>
                      <Cell>{doc.originalFilename}</Cell>
                      <Cell mono>{Math.round(doc.sizeBytes / 1024)} KB</Cell>
                      <Cell mono>{doc.downloadUrl}</Cell>
                    </Row>
                  ))}
                </Table>
              )}
            </Section>

            <Section title="timeline" subtitle="Oldest first. 'respond' is the student's own reply.">
              {value.internship.timeline.length === 0 ? (
                <p className="text-xs text-zinc-500">No events yet.</p>
              ) : (
                <Table head={["when", "who", "action", "reason"]}>
                  {value.internship.timeline.map((entry) => (
                    <Row key={entry.id}>
                      <Cell mono>{entry.createdAt.slice(0, 16).replace("T", " ")}</Cell>
                      <Cell>
                        {entry.actorName} <Pill tone="mute">{entry.actorRole}</Pill>
                      </Cell>
                      <Cell>
                        <Pill tone={entry.action === "verify" ? "ok" : "warn"}>{entry.action}</Pill>
                      </Cell>
                      <Cell>{entry.reason}</Cell>
                    </Row>
                  ))}
                </Table>
              )}
            </Section>

            <Section
              title="verifyInternship(id, input)"
              subtitle="Three submit buttons in one form, each carrying its own action value — no JavaScript required."
            >
              <form action={verifyAction} className="space-y-3">
                <input type="hidden" name="internshipId" value={value.internship.id} />

                <fieldset className="space-y-1">
                  <legend className="text-xs font-medium">Before publishing, confirm:</legend>
                  {CONFIRMATIONS.map(([name, label]) => (
                    <label key={name} className="flex items-center gap-2 text-xs">
                      <input type="checkbox" name={name} />
                      {label}
                    </label>
                  ))}
                </fieldset>

                <label className="block space-y-1">
                  <span className="text-xs font-medium">
                    Reason — required for request changes and reject, minimum 10 characters
                  </span>
                  <textarea
                    name="reason"
                    rows={2}
                    className="w-full rounded border border-zinc-300 px-2 py-1 font-mono text-xs"
                    placeholder="The student reads this."
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    name="action"
                    value="verify"
                    className="rounded bg-green-700 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-800"
                  >
                    Verify &amp; publish
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="request_changes"
                    className="rounded border border-zinc-400 bg-white px-2.5 py-1 text-xs font-medium hover:bg-zinc-50"
                  >
                    Request changes
                  </button>
                  <button
                    type="submit"
                    name="action"
                    value="reject"
                    className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>

                <p className="text-[11px] text-zinc-500">
                  Once verified this becomes visible to every student on Explore. Submitting twice
                  gives one decision and an InvalidStateError — the status is part of the WHERE
                  clause.
                </p>
              </form>
            </Section>
          </>
        )}
      </Result>
    </>
  );
}
