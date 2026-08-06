import Link from "next/link";
import { getVerificationDetail } from "@/controllers/experience-verification.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { PlanVsReality } from "@/components/faculty/PlanVsReality";
import { EvidenceViewer } from "@/components/faculty/EvidenceViewer";
import { FactRow } from "@/components/faculty/FactRow";
import { DecisionForm } from "@/components/faculty/DecisionForm";

export default async function VerificationDetailPage(
  props: PageProps<"/faculty/verifications/[id]">
) {
  await requireFacultyPage();
  const { id } = await props.params;
  const detail = await getVerificationDetail(id);

  const { student, approvedPlan, experience } = detail;

  const comparisonRows = [
    {
      label: "Company",
      approved: approvedPlan.companyName,
      actual: experience.companyName,
    },
    {
      label: "Role",
      approved: approvedPlan.role,
      actual: experience.role,
    },
    {
      label: "Dates",
      approved: approvedPlan.dates,
      actual: experience.dates,
    },
    {
      label: "Fee",
      approved: approvedPlan.feePaid ? `Rs. ${approvedPlan.feePaid.toLocaleString()}` : "None",
      actual: experience.feePaid ? `Rs. ${experience.feePaid.toLocaleString()}` : "None",
    },
    {
      label: "Stipend",
      approved: approvedPlan.stipend ? `Rs. ${approvedPlan.stipend.toLocaleString()}` : "None",
      actual: experience.stipend ? `Rs. ${experience.stipend.toLocaleString()}` : "None",
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 text-slate-900 dark:text-slate-100">
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
          {student.name} <span className="text-slate-400 font-normal">&bull;</span>{" "}
          <span className="font-mono text-base font-normal text-slate-600 dark:text-slate-300">{student.registerNumber}</span>{" "}
          <span className="text-slate-400 font-normal">&bull;</span>{" "}
          <span className="text-base font-medium text-slate-700 dark:text-slate-300">{student.className}</span>
        </h1>
      </div>

      {/* Top 2-Column Section: Plan vs Reality & Completion Certificate */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlanVsReality rows={comparisonRows} />
        <EvidenceViewer title="COMPLETION CERTIFICATE" evidence={experience.certificate} />
      </div>

      {/* The Experience Section (what will be published) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 pb-1.5 dark:border-slate-800">
          THE EXPERIENCE <span className="font-normal text-slate-400">(what will be published on Explore)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          <FactRow label="Nature of work" value={experience.workNature} />
          <FactRow label="Project" value={experience.projectTitle} />
          <FactRow label="Summary" value={experience.summary} />
          <FactRow label="Mentor" value={experience.mentorFrequency} />
          <FactRow
            label="Skills after"
            value={experience.skills ? experience.skills.join(", ") : "—"}
          />
          <FactRow label="How they got in" value={experience.howGotIn} />
          <FactRow label="Suits" value={experience.suitsWho} />
        </div>
      </div>

      {/* Decision Form with Quality Gate Checkboxes */}
      <div>
        <DecisionForm
          itemId={id}
          idFieldName="experienceId"
          actionUrl="/faculty/verifications/actions"
          primaryButtonText="Verify & publish"
          secondaryButtonText="Request changes"
          primaryActionValue="verify"
          secondaryActionValue="request_changes"
          showVerificationCheckboxes={true}
        />
      </div>
    </div>
  );
}
