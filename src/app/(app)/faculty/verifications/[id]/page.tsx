import Link from "next/link";
import { getVerificationDetail } from "@/controllers/verification.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { EvidenceViewer } from "@/components/faculty/EvidenceViewer";
import { FactRow } from "@/components/faculty/FactRow";
import { DecisionForm } from "@/components/faculty/DecisionForm";
import {
  APPLICATION_SOURCES,
  DOMAINS,
  MENTOR_FREQUENCIES,
  WORK_MODES,
  WORK_NATURES,
  labelFor,
} from "@/lib/constants/options";
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
  props: PageProps<"/faculty/verifications/[id]">
) {
  await requireFacultyPage();
  const { id } = await props.params;
  const { internship, student } = await getVerificationDetail(id);

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 text-slate-900 sm:p-6 dark:text-slate-100">
      {/* Back Link */}
      <div>
        <Link
          href="/faculty/verifications"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          &larr; Back to queue
        </Link>
      </div>

      {/* Student Identity Banner */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {student.fullName} <span className="font-normal text-slate-400">&bull;</span>{" "}
          <span className="font-mono text-base font-normal text-slate-600 dark:text-slate-300">
            {student.registerNumber}
          </span>{" "}
          <span className="font-normal text-slate-400">&bull;</span>{" "}
          <span className="text-base font-medium text-slate-700 dark:text-slate-300">
            {student.className ?? "No class"}
          </span>
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* The facts as submitted */}
        <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="border-b border-slate-100 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
            THE INTERNSHIP
          </h3>
          <div className="grid grid-cols-1 gap-x-6 gap-y-1.5">
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
        </div>

        {/* Documents — the thing being checked against */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            DOCUMENTS ({internship.documents.length})
          </h3>
          {internship.documents.length === 0 ? (
            <EvidenceViewer title="COMPLETION CERTIFICATE" evidence={null} />
          ) : (
            internship.documents.map((document) => (
              <EvidenceViewer
                key={document.id}
                title={document.docType}
                evidence={document}
              />
            ))
          )}
        </div>
      </div>

      {/* What will be published */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h3 className="border-b border-slate-100 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:text-slate-400">
          THE EXPERIENCE{" "}
          <span className="font-normal text-slate-400">(what will be published on Explore)</span>
        </h3>
        <div className="grid grid-cols-1 gap-x-6 gap-y-1.5 sm:grid-cols-2">
          <FactRow
            label="Nature of work"
            value={labelFor(WORK_NATURES, internship.workNature)}
          />
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
      </div>

      {/* Decision Form with Quality Gate Checkboxes */}
      <DecisionForm
        itemId={id}
        idFieldName="internshipId"
        action={verifyInternshipAction}
        primaryButtonText="Verify & publish"
        secondaryButtonText="Request changes"
        primaryActionValue="verify"
        secondaryActionValue="request_changes"
        showVerificationCheckboxes
      />
    </div>
  );
}
