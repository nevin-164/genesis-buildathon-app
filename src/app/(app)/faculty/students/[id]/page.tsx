import Link from "next/link";
import { notFound } from "next/navigation";

import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import {
  CHIP_MONO,
  EMPTY,
  FAINT,
  INK,
  LINK_ACTION,
  LINK_BACK,
  MONO,
  MUTED,
  PANEL_FLUSH,
  PANEL_HEADER,
  SECTION_HEADING,
  TABLE,
  TABLE_HEAD,
  TABLE_WRAP,
  TBODY,
  TD,
  TH,
  TR,
  badge,
  type Tone,
} from "@/components/staff/staff-ui";
import { getStudentHistory } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import { cn } from "@/lib/cn";
import type { InternshipStatus } from "@/types/contracts";

const STATUS_BADGE: Record<InternshipStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  submitted: { label: "Under review", tone: "lime" },
  changes_requested: { label: "Changes requested", tone: "amber" },
  verified: { label: "Published", tone: "mint" },
  rejected: { label: "Rejected", tone: "rose" },
};

function StatusBadge({ status }: { status: InternshipStatus }) {
  const { label, tone } = STATUS_BADGE[status];
  return <span className={badge(tone)}>{label}</span>;
}

export default async function SingleStudentPage(props: PageProps<"/faculty/students/[id]">) {
  await requireFacultyPage();
  const { id } = await props.params;

  // The controller throws NotFoundError for a student with no claim on it — and
  // for a malformed id. Render the 404 this folder already ships rather than
  // letting the error boundary answer 200 for a page that does not exist.
  const history = await getStudentHistory(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  const { student, internships } = history;

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Faculty console · Students"
        title={student.fullName}
        back={
          <Link href="/faculty/students" className={LINK_BACK}>
            <span aria-hidden="true">&larr;</span> Back to assigned students
          </Link>
        }
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className={CHIP_MONO}>{student.registerNumber}</span>
            <span>{student.className ?? "Not enrolled"}</span>
            <span className={FAINT}>{student.email}</span>
          </span>
        }
      />

      <section className={PANEL_FLUSH}>
        <div className={PANEL_HEADER}>
          <h2 className={SECTION_HEADING}>Internships</h2>
          <span className={cn(MONO, MUTED)}>{internships.length}</span>
        </div>

        {internships.length === 0 ? (
          <p className={EMPTY}>Nothing added yet.</p>
        ) : (
          <div className={TABLE_WRAP}>
            <table className={TABLE}>
              <thead className={TABLE_HEAD}>
                <tr>
                  <th className={TH}>Company</th>
                  <th className={TH}>Role</th>
                  <th className={TH}>Status</th>
                  <th className={cn(TH, "text-right")}>Verification</th>
                </tr>
              </thead>

              <tbody className={TBODY}>
                {internships.map((internship) => (
                  <tr key={internship.id} className={TR}>
                    <td className="px-5 py-3.5 sm:px-6">
                      <span className={cn("font-semibold", INK)}>
                        {internship.companyName}
                      </span>
                    </td>

                    <td className={TD}>{internship.roleTitle}</td>

                    <td className={TD}>
                      <StatusBadge status={internship.status} />
                    </td>

                    <td className="whitespace-nowrap px-5 py-3.5 text-right sm:px-6">
                      {/* A draft is not visible to the advisor yet, so there is
                          nothing to open. */}
                      {internship.status === "draft" ? (
                        <span className={cn("text-xs", FAINT)}>—</span>
                      ) : (
                        <Link
                          href={`/faculty/verifications/${internship.id}`}
                          className={LINK_ACTION}
                        >
                          Open <span aria-hidden="true">&rarr;</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </StaffContent>
  );
}
