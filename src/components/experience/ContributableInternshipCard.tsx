import { StartExperienceDraftForm } from "@/components/experience/StartExperienceDraftForm";
import { contributableReadyLabel } from "@/components/experience/experience-workflow";
import { DISPLAY_SECTION, INK, MUTED, PANEL } from "@/components/explore/explore-ui";
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
      className={cn(PANEL, "min-w-0 border-[#b8d4bc] bg-[#f4f8f5] p-4 sm:p-5")}
      aria-labelledby={`contributable-${contributable.applicationId}-heading`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2d5038]">
        Ready to contribute
      </p>
      <h2
        id={`contributable-${contributable.applicationId}-heading`}
        className={cn("mt-1 text-base sm:text-lg", DISPLAY_SECTION)}
      >
        Share your approved internship
      </h2>
      <p className={cn("mt-2 text-sm leading-relaxed", MUTED)}>
        Your internship at{" "}
        <span className={cn("font-semibold", INK)}>{contributable.companyName}</span> is approved.
        Start a report so other students can learn from your experience after faculty verification.
      </p>
      <dl className={cn("mt-3 grid gap-2 text-sm sm:grid-cols-2", MUTED)}>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[#8a968d]">Role</dt>
          <dd className={cn("mt-0.5 break-words", INK)}>{contributable.roleTitle}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium uppercase tracking-wide text-[#8a968d]">Dates</dt>
          <dd className={cn("mt-0.5 break-words", INK)}>
            {formatDateRange(contributable.startDate, contributable.endDate)}
          </dd>
        </div>
      </dl>
      <StartExperienceDraftForm contributable={contributable} />
      <p className="sr-only">{contributableReadyLabel(contributable)}</p>
    </section>
  );
}
