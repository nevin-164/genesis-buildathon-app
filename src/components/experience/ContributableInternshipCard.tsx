import { StartExperienceDraftForm } from "@/components/experience/StartExperienceDraftForm";
import { contributableReadyLabel } from "@/components/experience/experience-workflow";
import { BODY_LEAD } from "@/components/student/student-ui";
import { CompanyMark, DefinitionStrip } from "@/components/student/primitives";
import { cn } from "@/lib/cn";
import type { ContributableApplication } from "@/types/contracts";

function formatDateRange(startDate: string, endDate: string): string {
  const format = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  return `${format(startDate)} – ${format(endDate)}`;
}

export function ContributableInternshipCard({
  contributable,
}: {
  contributable: ContributableApplication;
}) {
  return (
    <section
      className="relative min-w-0 py-5 first:pt-0 last:pb-0"
      aria-labelledby={`contributable-${contributable.applicationId}-heading`}
    >
      <div className="grid min-w-0 gap-5 lg:grid-cols-12 lg:items-center lg:gap-6">
        <div className="flex min-w-0 gap-4 lg:col-span-4">
          <CompanyMark name={contributable.companyName} size="lg" />
          <div className="min-w-0 flex-1">
            <h2
              id={`contributable-${contributable.applicationId}-heading`}
              className="text-lg font-semibold leading-snug text-[var(--il-ink)] sm:text-xl"
            >
              {contributable.companyName}
            </h2>
            <p className="mt-0.5 text-sm font-medium text-[var(--il-moss)] sm:text-base">
              {contributable.roleTitle}
            </p>
            <DefinitionStrip
              className="mt-3"
              items={[
                {
                  label: "Internship dates",
                  value: formatDateRange(contributable.startDate, contributable.endDate),
                },
              ]}
            />
          </div>
        </div>

        <div className="min-w-0 lg:col-span-5">
          <p className={cn(BODY_LEAD, "text-sm sm:text-[15px]")}>
            Your internship is approved. Start a report so other students can learn from your
            experience after faculty verification.
          </p>
        </div>

        <div className="min-w-0 lg:col-span-3 lg:flex lg:justify-end">
          <StartExperienceDraftForm contributable={contributable} />
        </div>
      </div>

      <p className="sr-only">{contributableReadyLabel(contributable)}</p>
    </section>
  );
}
