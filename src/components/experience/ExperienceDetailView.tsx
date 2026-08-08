import Link from "next/link";
import type { ReactNode } from "react";

import { Timeline } from "@/components/application/Timeline";
import { latestFacultyChanges } from "@/components/experience/form-utils";
import {
  experienceDetailActions,
  experienceStatusDescription,
  experienceStatusHeadline,
} from "@/components/experience/experience-workflow";
import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { SkillChips } from "@/components/explore/SkillChips";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  DISPLAY_COMPANY,
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  LABEL,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { Badge } from "@/components/ui";
import {
  APPLICATION_SOURCES,
  DOMAINS,
  EXPERIENCE_STATUS_LABEL,
  EXPERIENCE_STATUS_TONE,
  MENTOR_FREQUENCIES,
  WORK_MODES,
  WORK_NATURES,
  labelFor,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { ExperienceDetail } from "@/types/contracts";

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSubmittedAt(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatFee(amount: number | null): string {
  if (amount === null || amount === 0) return "No fee";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function formatStipend(amount: number | null): string {
  if (amount === null || amount === 0) return "No stipend";
  return `₹${amount.toLocaleString("en-IN")}`;
}

function DetailField({
  label,
  value,
  children,
}: {
  label: string;
  value?: string | null;
  children?: ReactNode;
}) {
  const content = children ?? value;
  if (content === null || content === undefined || content === "") return null;

  return (
    <div className="min-w-0">
      <dt className={LABEL}>{label}</dt>
      <dd className={cn("mt-0.5 max-w-prose text-sm break-words", INK)}>{content}</dd>
    </div>
  );
}

export function ExperienceDetailView({ experience }: { experience: ExperienceDetail }) {
  const domainLabel = labelFor(DOMAINS, experience.domain);
  const modeLabel = labelFor(WORK_MODES, experience.workMode);
  const natureLabel = labelFor(WORK_NATURES, experience.workNature);
  const sourceLabel = experience.applicationSource
    ? labelFor(APPLICATION_SOURCES, experience.applicationSource)
    : null;
  const mentorFreqLabel = experience.mentorFrequency
    ? labelFor(MENTOR_FREQUENCIES, experience.mentorFrequency)
    : null;
  const durationLabel = `${experience.durationWeeks} ${
    experience.durationWeeks === 1 ? "week" : "weeks"
  }`;
  const dateRange = `${formatDisplayDate(experience.startDate)} – ${formatDisplayDate(experience.endDate)}`;
  const facultyChanges = latestFacultyChanges(experience.timeline, experience.latestReason);
  const { actions: detailActions, statusNotice } = experienceDetailActions(experience);
  const headline = experienceStatusHeadline(experience.status);
  const description = experienceStatusDescription(experience.status);
  const beginnerLabel =
    experience.beginnerFriendly === true
      ? "Beginner-friendly"
      : experience.beginnerFriendly === false
        ? "Not marked as beginner-friendly"
        : null;

  return (
    <article className="w-full min-w-0 space-y-4 sm:space-y-5">
      <Link
        href="/student/experience"
        className={cn(
          "inline-flex scroll-mt-20 items-center gap-1 text-sm font-medium sm:scroll-mt-24",
          INK,
          "hover:text-[#2d5038] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        <ChevronRightIcon className="rotate-180" aria-hidden="true" />
        Back to my experience
      </Link>

      <header className={cn(PANEL, "min-w-0 bg-[#f4f8f5] p-4 sm:p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className={cn("text-xs font-medium tracking-wide", MUTED)}>{headline}</p>
            <h1 className={cn("mt-1 text-xl break-words sm:text-2xl", DISPLAY_COMPANY)}>
              {experience.companyName}
            </h1>
            <p className={cn("mt-1 text-base font-medium break-words text-[#2a3d30]")}>
              {experience.roleTitle}
            </p>
            {description && <p className={cn("mt-2 max-w-prose text-sm", MUTED)}>{description}</p>}
            {experience.submittedAt && (
              <p className={cn("mt-2 text-sm", MUTED)}>
                Submitted {formatSubmittedAt(experience.submittedAt)}
              </p>
            )}
          </div>
          <Badge tone={EXPERIENCE_STATUS_TONE[experience.status]}>
            {EXPERIENCE_STATUS_LABEL[experience.status]}
          </Badge>
        </div>
      </header>

      {experience.status === "changes_requested" && facultyChanges && (
        <section
          className={cn(PANEL, "min-w-0 border-amber-200/90 bg-amber-50/60 p-4 sm:p-5")}
          aria-labelledby="experience-detail-changes-heading"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-900">
            Changes requested
          </p>
          <h2 id="experience-detail-changes-heading" className={cn("mt-1 text-base", DISPLAY_SECTION)}>
            Faculty feedback
          </h2>
          <p className="mt-2 text-sm leading-relaxed break-words text-[#3d4a42]">
            {facultyChanges}
          </p>
          <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
            Update your report and resubmit when you are ready.
          </p>
        </section>
      )}

      {experience.status === "verified" && (
        <section className={cn(PANEL, "min-w-0 border-[#b8d4bc] bg-[#ecf8ee]/70 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Published as a Reality Card</h2>
          <p className={cn("mt-1 max-w-prose text-sm", MUTED)}>
            Your verified experience is now available for other students to explore. Your
            certificate remains private faculty evidence.
          </p>
          <Link
            href={`/student/explore/${experience.id}`}
            className={cn(BTN_PRIMARY, "mt-3 inline-flex min-h-11 px-4 py-2.5 text-sm", MOTION, FOCUS_RING)}
          >
            View Reality Card
          </Link>
        </section>
      )}

      {experience.status === "rejected" && experience.latestReason?.trim() && (
        <section className={cn(PANEL, "min-w-0 border-red-200/80 bg-red-50/40 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Report not approved</h2>
          <p className={cn("mt-2 max-w-prose text-sm leading-relaxed break-words", MUTED)}>
            {experience.latestReason}
          </p>
        </section>
      )}

      <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-start">
        <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Internship overview</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <DetailField label="Domain" value={domainLabel} />
            <DetailField label="Work mode" value={modeLabel} />
            <DetailField label="Work nature" value={natureLabel} />
            <DetailField label="Location" value={experience.location ?? undefined} />
            <DetailField label="Duration" value={durationLabel} />
            <DetailField label="Dates" value={dateRange} />
            <DetailField label="Fee" value={formatFee(experience.feeAmount)} />
            <DetailField label="Stipend" value={formatStipend(experience.stipendAmount)} />
          </dl>
        </section>

        <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Verification details</h2>
          <dl className="mt-4 space-y-4">
            <DetailField
              label="Certificate"
              value={
                experience.certificate
                  ? `${experience.certificate.originalFilename} attached (private)`
                  : "Not attached"
              }
            />
            <DetailField label="Application source" value={sourceLabel ?? undefined} />
            <DetailField
              label="Mentor support"
              value={
                experience.hadMentor
                  ? mentorFreqLabel
                    ? `Mentor available · ${mentorFreqLabel}`
                    : "Mentor available"
                  : "No dedicated mentor reported"
              }
            />
            {beginnerLabel && <DetailField label="Beginner friendly" value={beginnerLabel} />}
          </dl>
        </section>
      </div>

      <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")}>
        <h2 className={cn("text-base", DISPLAY_SECTION)}>What you worked on</h2>
        <dl className="mt-4 space-y-4">
          {experience.projectTitle && (
            <DetailField label="Project" value={experience.projectTitle} />
          )}
          <DetailField label="Work summary" value={experience.workSummary} />
          {experience.technologies.length > 0 && (
            <div>
              <dt className={LABEL}>Technologies</dt>
              <dd className="mt-2">
                <SkillChips labels={experience.technologies} />
              </dd>
            </div>
          )}
        </dl>
      </section>

      {(experience.skillsBefore.length > 0 || experience.skillsAfter.length > 0) && (
        <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Skills</h2>
          <dl className="mt-4 grid gap-4 md:grid-cols-2">
            {experience.skillsBefore.length > 0 && (
              <div>
                <dt className={LABEL}>Before the internship</dt>
                <dd className="mt-2">
                  <SkillChips labels={experience.skillsBefore} />
                </dd>
              </div>
            )}
            {experience.skillsAfter.length > 0 && (
              <div>
                <dt className={LABEL}>Skills gained</dt>
                <dd className="mt-2">
                  <SkillChips labels={experience.skillsAfter} />
                </dd>
              </div>
            )}
          </dl>
        </section>
      )}

      {(experience.applicationProcess?.trim() || experience.suitsWhom?.trim()) && (
        <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")}>
          <h2 className={cn("text-base", DISPLAY_SECTION)}>Guidance for future students</h2>
          <dl className="mt-4 space-y-4">
            <DetailField label="Application pathway" value={experience.applicationProcess} />
            <DetailField label="Who would benefit" value={experience.suitsWhom} />
          </dl>
        </section>
      )}

      {(detailActions.length > 0 || statusNotice) && (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          {statusNotice && (
            <p className={cn("text-sm font-medium text-[#4a5c50]", MUTED)} role="status">
              {statusNotice}
            </p>
          )}
          {detailActions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={cn(
                action.variant === "primary" ? BTN_PRIMARY : BTN_GHOST,
                "inline-flex min-h-11 w-full items-center justify-center px-4 py-2.5 text-sm sm:w-auto",
                MOTION,
                FOCUS_RING,
              )}
            >
              {action.label}
            </Link>
          ))}
        </div>
      )}

      <section className={cn(PANEL, "min-w-0 p-4 sm:p-5")} aria-labelledby="experience-progress-heading">
        <h2 id="experience-progress-heading" className={cn("text-base", DISPLAY_SECTION)}>
          Verification progress
        </h2>
        <div className="mt-4 min-w-0">
          <Timeline entries={experience.timeline} />
        </div>
      </section>
    </article>
  );
}
