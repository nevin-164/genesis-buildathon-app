import Link from "next/link";
import { getApprovalBrief } from "@/controllers/application-review.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { BriefFlags } from "@/components/faculty/BriefFlags";
import { EvidenceViewer } from "@/components/faculty/EvidenceViewer";
import { FactRow } from "@/components/faculty/FactRow";
import { DecisionForm } from "@/components/faculty/DecisionForm";
import Timeline from "@/components/application/Timeline";

export default async function ApprovalBriefPage(
  props: PageProps<"/faculty/applications/[id]">
) {
  await requireFacultyPage();
  const { id } = await props.params;
  const brief = await getApprovalBrief(id);

  const { student, application, flags, waitingDays, timeline } = brief;

  let waitingBadgeColor = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  if (waitingDays > 14) {
    waitingBadgeColor = "bg-rose-100 text-rose-800 font-bold dark:bg-rose-950 dark:text-rose-300";
  } else if (waitingDays > 7) {
    waitingBadgeColor = "bg-amber-100 text-amber-800 font-bold dark:bg-amber-950 dark:text-amber-300";
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 p-4 sm:p-6 text-slate-900 dark:text-slate-100">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/faculty/applications"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          &larr; Back to queue
        </Link>
        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${waitingBadgeColor}`}
        >
          Waiting {waitingDays} {waitingDays === 1 ? "day" : "days"}
        </span>
      </div>

      {/* Student Identity Banner */}
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {student.name} <span className="text-slate-400 font-normal">&bull;</span>{" "}
          <span className="font-mono text-base font-normal text-slate-600 dark:text-slate-300">{student.registerNumber}</span>{" "}
          <span className="text-slate-400 font-normal">&bull;</span>{" "}
          <span className="text-base font-medium text-slate-700 dark:text-slate-300">{student.className}</span>
        </h1>
      </div>

      {/* Top 2-Column Section: Things to Check (Flags) & Offer Letter */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BriefFlags flags={flags} />
        <EvidenceViewer title="OFFER LETTER" evidence={application.offerLetter} />
      </div>

      {/* Facts Card: The Internship, Money & Expected Work */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-1 dark:border-slate-800">
            THE INTERNSHIP
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <FactRow label="Company" value={application.companyName} />
            <FactRow label="Role" value={application.role} />
            <FactRow label="Domain" value={application.domain} />
            <FactRow label="Mode" value={application.workMode} />
            <FactRow
              label="Dates"
              value={`${application.startDate} - ${application.endDate} (${application.durationWeeks} weeks)`}
            />
            <FactRow label="Found via" value={application.source} />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-1 dark:border-slate-800">
            MONEY
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
            <FactRow
              label="Student pays"
              value={application.feePaid ? `Rs. ${application.feePaid.toLocaleString()}` : "None"}
            />
            <FactRow
              label="Stipend"
              value={application.stipend ? `Rs. ${application.stipend.toLocaleString()}` : "None"}
            />
          </div>
        </div>

        <div>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-1 dark:border-slate-800">
            EXPECTED WORK
          </h3>
          <div className="grid grid-cols-1 gap-1">
            <FactRow
              label="Technologies"
              value={application.technologies ? application.technologies.join(", ") : "—"}
            />
          </div>
        </div>
      </div>

      {/* Decision Form */}
      <div>
        <DecisionForm
          itemId={id}
          idFieldName="applicationId"
          actionUrl="/faculty/applications/actions"
          primaryButtonText="Approve"
          secondaryButtonText="Request clarification"
          primaryActionValue="approve"
          secondaryActionValue="request_clarification"
        />
      </div>

      {/* Clarification History Timeline (if available) */}
      {timeline && timeline.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Clarification History
          </h3>
          <Timeline items={timeline} />
        </div>
      )}
    </div>
  );
}
