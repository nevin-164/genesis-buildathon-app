import Link from "next/link";
import { notFound } from "next/navigation";

import { DecisionForm } from "@/components/faculty/DecisionForm";
import { EvidenceViewer } from "@/components/faculty/EvidenceViewer";
import { FactRow } from "@/components/faculty/FactRow";
import { StaffContent } from "@/components/staff/StaffShell";
import {
  CHIP_MONO,
  DIVIDER,
  EYEBROW,
  FAINT,
  LINK_BACK,
  MUTED,
  PAGE_TITLE,
  PANEL_PADDED,
  SECTION_HEADING,
} from "@/components/staff/staff-ui";
import { getVerificationDetail } from "@/controllers/verification.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
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

import { verifyInternshipAction } from "../actions";

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

export default async function VerificationDetailPage(
  props: PageProps<"/faculty/verifications/[id]">,
) {
  await requireFacultyPage();
  const { id } = await props.params;

  // Another advisor's internship, a missing one and a malformed id all arrive
  // as NotFoundError — deliberately indistinguishable, so probing ids tells
  // nobody anything.
  const { internship, student } = await getVerificationDetail(id).catch((error) => {
    if (error instanceof NotFoundError) notFound();
    throw error;
  });

  return (
    <StaffContent>
      <div>
        <Link href="/faculty/verifications" className={LINK_BACK}>
          <span aria-hidden="true">&larr;</span> Back to queue
        </Link>
      </div>

      {/* Who this is, before anything they wrote. */}
      <header className={cn(PANEL_PADDED, "py-4 sm:py-5")}>
        <p className={cn(EYEBROW, "mb-2")}>Faculty console · Verification</p>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <h1 className={PAGE_TITLE}>{student.fullName}</h1>
          <span className={CHIP_MONO}>{student.registerNumber}</span>
          <span className={cn("text-sm font-medium", MUTED)}>
            {student.className ?? "No class"}
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* The facts as submitted */}
        <section className={PANEL_PADDED}>
          <h2 className={cn(SECTION_HEADING, "border-b pb-2.5", DIVIDER)}>The internship</h2>
          <div className="mt-3 grid grid-cols-1 gap-y-1">
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
          </div>
        </section>

        {/* Documents — the thing being checked against */}
        <section className="space-y-3">
          <h2 className={SECTION_HEADING}>Documents ({internship.documents.length})</h2>
          {internship.documents.length === 0 ? (
            <EvidenceViewer title="Completion certificate" evidence={null} />
          ) : (
            internship.documents.map((document) => (
              <EvidenceViewer key={document.id} title={document.docType} evidence={document} />
            ))
          )}
        </section>
      </div>

      {/* What will be published */}
      <section className={PANEL_PADDED}>
        <div className={cn("flex flex-wrap items-baseline gap-2 border-b pb-2.5", DIVIDER)}>
          <h2 className={SECTION_HEADING}>The experience</h2>
          <span className={cn("text-xs", FAINT)}>(what will be published on Explore)</span>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2">
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
          <FactRow label="Skills before" value={internship.skillsBefore.join(", ")} />
          <FactRow label="Skills after" value={internship.skillsAfter.join(", ")} />
          <FactRow label="Technologies" value={internship.technologies.join(", ")} />
          <FactRow
            label="How they got in"
            value={labelFor(APPLICATION_SOURCES, internship.applicationSource)}
          />
          <FactRow label="Application process" value={internship.applicationProcess} />
          <FactRow label="Suits" value={internship.suitsWhom} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={SECTION_HEADING}>Your decision</h2>
        <DecisionForm
          itemId={id}
          idFieldName="internshipId"
          action={verifyInternshipAction}
          primaryButtonText="Verify and publish"
          secondaryButtonText="Request changes"
          primaryActionValue="verify"
          secondaryActionValue="request_changes"
          showVerificationCheckboxes
        />
      </section>
    </StaffContent>
  );
}
