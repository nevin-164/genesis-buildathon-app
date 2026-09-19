import Link from "next/link";
import { notFound } from "next/navigation";

import { AppealDecisionForm } from "@/components/admin/AppealDecisionForm";
import { EvidenceViewer } from "@/components/faculty/EvidenceViewer";
import { FactRow } from "@/components/faculty/FactRow";
import { StaffContent } from "@/components/staff/StaffShell";
import {
  CHIP_MONO,
  DIVIDER,
  EYEBROW,
  FAINT,
  INK,
  LINK_BACK,
  MUTED,
  NOTICE_DANGER,
  PAGE_TITLE,
  PANEL_PADDED,
  SECTION_HEADING,
} from "@/components/staff/staff-ui";
import { getAppealDetail } from "@/controllers/appeal.controller";
import { requireAdminPage } from "@/lib/auth/dal";
import { NotFoundError } from "@/lib/auth/errors";
import {
  APPLICATION_SOURCES,
  DOMAINS,
  MENTOR_FREQUENCIES,
  WORK_MODES,
  WORK_NATURES,
  labelFor,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";

import { decideAppealAction } from "../actions";

const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso: string) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso : DATE_FORMAT.format(date);
}

function formatMoney(amount: number | null) {
  return amount === null ? "Not disclosed" : `Rs. ${amount.toLocaleString("en-IN")}`;
}

/**
 * Ruling on one appeal.
 *
 * The page is ordered as an argument, not as a record: the rejection, then the
 * student's answer to it, then the evidence, then the internship itself. An
 * administrator arrives knowing nothing about this internship, so leading with
 * the facts as submitted — the way the faculty screen does — would bury the
 * only question actually being asked.
 */
export default async function AppealDetailPage(props: PageProps<"/admin/appeals/[id]">) {
  await requireAdminPage();
  const { id } = await props.params;

  // An internship that is not under appeal, a missing one and a malformed id
  // all arrive as NotFoundError — deliberately indistinguishable.
  const { internship, student, appeal } = await getAppealDetail(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <StaffContent>
      <div>
        <Link href="/admin/appeals" className={LINK_BACK}>
          <span aria-hidden="true">&larr;</span> Back to appeals
        </Link>
      </div>

      <header className={cn(PANEL_PADDED, "py-4 sm:py-5")}>
        <p className={cn(EYEBROW, "mb-2")}>Admin console &middot; Appeal</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className={PAGE_TITLE}>{student.fullName}</h1>
          <span className={CHIP_MONO}>{student.registerNumber}</span>
          <span className={cn("text-sm font-medium", MUTED)}>{student.className}</span>
        </div>
        <p className={cn("mt-2 text-sm", MUTED)}>
          {internship.companyName} &middot; {internship.roleTitle} &middot; appealed{" "}
          {formatDate(appeal.appealedAt)}
        </p>
      </header>

      {/* 1 · The decision being contested. */}
      <section className={PANEL_PADDED}>
        <div className={cn("flex flex-wrap items-baseline gap-2 border-b pb-2.5", DIVIDER)}>
          <h2 className={SECTION_HEADING}>Why it was rejected</h2>
          <span className={cn("text-xs", FAINT)}>
            by {appeal.facultyName ?? "the assigned advisor"}
          </span>
        </div>
        {appeal.rejectionReason ? (
          <p className={cn("mt-3 text-sm leading-relaxed whitespace-pre-line", INK)}>
            {appeal.rejectionReason}
          </p>
        ) : (
          /* Reachable only for data written before the reason CHECK existed.
             Worth flagging rather than rendering as a blank space: an
             unexplained rejection is a strong argument for the appeal. */
          <p className={cn(NOTICE_DANGER, "mt-3")}>
            No reason was recorded with this rejection.
          </p>
        )}
      </section>

      {/* 2 · The student's answer to it. */}
      <section className={PANEL_PADDED}>
        <h2 className={cn(SECTION_HEADING, "border-b pb-2.5", DIVIDER)}>The student&apos;s case</h2>
        <p className={cn("mt-3 text-sm leading-relaxed whitespace-pre-line", INK)}>
          {appeal.reason}
        </p>
      </section>

      {/* 3 · What they attached to back it up. */}
      <section className="space-y-3">
        <h2 className={SECTION_HEADING}>Documents ({internship.documents.length})</h2>
        {internship.documents.length === 0 ? (
          <EvidenceViewer title="Supporting evidence" evidence={null} />
        ) : (
          internship.documents.map((document) => (
            <EvidenceViewer key={document.id} title={document.docType} evidence={document} />
          ))
        )}
      </section>

      {/* 4 · The internship itself — unchanged since the advisor read it, because
             a rejected write-up cannot be edited. */}
      <section className={PANEL_PADDED}>
        <div className={cn("flex flex-wrap items-baseline gap-2 border-b pb-2.5", DIVIDER)}>
          <h2 className={SECTION_HEADING}>The internship</h2>
          <span className={cn("text-xs", FAINT)}>
            (exactly as the advisor saw it — a rejected write-up cannot be edited)
          </span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
          <FactRow label="Company" value={internship.companyName} />
          <FactRow label="Role" value={internship.roleTitle} />
          <FactRow label="Domain" value={labelFor(DOMAINS, internship.domain)} />
          <FactRow
            label="Dates"
            value={`${formatDate(internship.startDate)} – ${formatDate(internship.endDate)} (${internship.durationWeeks} weeks)`}
          />
          <FactRow label="Location" value={internship.location} />
          <FactRow label="Mode" value={labelFor(WORK_MODES, internship.workMode)} />
          <FactRow label="Fee paid" value={formatMoney(internship.feeAmount)} />
          <FactRow label="Stipend" value={formatMoney(internship.stipendAmount)} />
          <FactRow label="Nature of work" value={labelFor(WORK_NATURES, internship.workNature)} />
          <FactRow label="Project" value={internship.projectTitle} />
          <FactRow label="Summary" value={internship.workSummary} />
          <FactRow
            label="Mentor"
            value={
              internship.hadMentor
                ? labelFor(MENTOR_FREQUENCIES, internship.mentorFrequency)
                : "No mentor"
            }
          />
          <FactRow label="Skills after" value={internship.skillsAfter.join(", ")} />
          <FactRow label="Technologies" value={internship.technologies.join(", ")} />
          <FactRow
            label="How they got in"
            value={labelFor(APPLICATION_SOURCES, internship.applicationSource)}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={SECTION_HEADING}>Your ruling</h2>
        <AppealDecisionForm
          internshipId={id}
          action={decideAppealAction}
          advisorName={appeal.facultyName}
        />
      </section>
    </StaffContent>
  );
}
