import Link from "next/link";
import type { ReactNode } from "react";

import { Timeline } from "@/components/application/Timeline";
import { latestFacultyChanges } from "@/components/experience/form-utils";
import {
  experienceDetailActions,
  experienceStatusDescription,
} from "@/components/experience/experience-workflow";
import { SkillChips } from "@/components/explore/SkillChips";
import {
  BTN_LIME,
  BTN_PRIMARY,
  BTN_SECONDARY,
  BODY,
  DIVIDER,
  EYEBROW,
  FOCUS_RING,
  HOVER_LIFT,
  INK,
  META,
  MOTION,
  MUTED,
  SECTION_TITLE,
} from "@/components/student/student-ui";
import {
  BackLink,
  EditorialSheet,
  IdentityMasthead,
  InsetPanel,
  Keyline,
  MetaGrid,
  MetaItem,
  QuoteBlock,
  SectionHeading,
  SheetDivider,
} from "@/components/student/primitives";
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

function ReportSection({
  eyebrow,
  title,
  children,
  id,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section className="min-w-0" aria-labelledby={id}>
      {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
      <h2 id={id} className={cn(SECTION_TITLE, eyebrow ? "mt-1" : "")}>
        {title}
      </h2>
      <Keyline className="mt-4 mb-5" />
      {children}
    </section>
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
  const description = experienceStatusDescription(experience.status);
  const beginnerLabel =
    experience.beginnerFriendly === true
      ? "Beginner-friendly"
      : experience.beginnerFriendly === false
        ? "Not marked as beginner-friendly"
        : null;

  return (
    <>
      <BackLink href="/student/experience" label="Back to my experience" />

      <EditorialSheet className="mt-4">
        <IdentityMasthead
          companyName={experience.companyName}
          roleTitle={experience.roleTitle}
          trailing={
            <>
              <Badge tone={EXPERIENCE_STATUS_TONE[experience.status]}>
                {EXPERIENCE_STATUS_LABEL[experience.status]}
              </Badge>
              {experience.submittedAt && (
                <p className={cn(META, "lg:text-right")}>
                  Submitted {formatSubmittedAt(experience.submittedAt)}
                </p>
              )}
              {description && (
                <p className={cn(META, "max-w-xs lg:text-right")}>{description}</p>
              )}
            </>
          }
        />

        {experience.status === "changes_requested" && facultyChanges && (
          <InsetPanel variant="attention" className="mt-6">
            <QuoteBlock label="Faculty feedback" variant="attention">
              {facultyChanges}
            </QuoteBlock>
            <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
              Update your report and resubmit when you are ready.
            </p>
          </InsetPanel>
        )}

        {experience.status === "verified" && (
          <InsetPanel
            variant="mint"
            className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className={EYEBROW}>Published</p>
              <p className={cn("mt-1 text-sm leading-relaxed", MUTED)}>
                Your verified experience is now available for other students to explore. Your
                certificate remains private faculty evidence.
              </p>
            </div>
            <Link
              href={`/student/explore/${experience.id}`}
              className={cn(
                BTN_LIME,
                "inline-flex min-h-11 shrink-0 items-center px-6 font-bold",
                MOTION,
                HOVER_LIFT,
                FOCUS_RING,
              )}
            >
              View Reality Card
            </Link>
          </InsetPanel>
        )}

        {experience.status === "rejected" && experience.latestReason?.trim() && (
          <InsetPanel variant="error" className="mt-6">
            <QuoteBlock label="Report not approved" variant="error">
              {experience.latestReason}
            </QuoteBlock>
          </InsetPanel>
        )}

        <SheetDivider className="my-8" />

        <div className="grid min-w-0 gap-8 lg:grid-cols-[minmax(0,1fr)_17rem] lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-10 sm:space-y-12">
          {experience.workSummary && (
            <ReportSection
              id="experience-work-heading"
              eyebrow="What you worked on"
              title="Work summary"
            >
              {experience.projectTitle && (
                <p className={cn("text-sm font-semibold", INK)}>{experience.projectTitle}</p>
              )}
              <p
                className={cn(
                  "max-w-prose text-sm leading-relaxed whitespace-pre-wrap break-words",
                  INK,
                  experience.projectTitle && "mt-2",
                )}
              >
                {experience.workSummary}
              </p>
              {experience.technologies.length > 0 && (
                <div className="mt-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                    Technologies
                  </p>
                  <div className="mt-2">
                    <SkillChips labels={experience.technologies} />
                  </div>
                </div>
              )}
            </ReportSection>
          )}

          {(experience.skillsBefore.length > 0 || experience.skillsAfter.length > 0) && (
            <ReportSection id="experience-skills-heading" eyebrow="Skills" title="Before and after">
              <div className="grid gap-8 md:grid-cols-2">
                {experience.skillsBefore.length > 0 && (
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                      Before the internship
                    </p>
                    <div className="mt-2">
                      <SkillChips labels={experience.skillsBefore} />
                    </div>
                  </div>
                )}
                {experience.skillsAfter.length > 0 && (
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                      Skills gained
                    </p>
                    <div className="mt-2">
                      <SkillChips labels={experience.skillsAfter} />
                    </div>
                  </div>
                )}
              </div>
            </ReportSection>
          )}

          {(experience.applicationProcess?.trim() || experience.suitsWhom?.trim()) && (
            <ReportSection
              id="experience-guidance-heading"
              eyebrow="For future students"
              title="Guidance"
            >
              {experience.applicationProcess?.trim() && (
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                    Application pathway
                  </p>
                  <p
                    className={cn(
                      "mt-2 max-w-prose text-sm leading-relaxed whitespace-pre-wrap break-words",
                      BODY,
                    )}
                  >
                    {experience.applicationProcess}
                  </p>
                </div>
              )}
              {experience.suitsWhom?.trim() && (
                <div className={cn("min-w-0", experience.applicationProcess?.trim() && "mt-6")}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                    Who would benefit
                  </p>
                  <p
                    className={cn(
                      "mt-2 max-w-prose text-sm leading-relaxed whitespace-pre-wrap break-words",
                      BODY,
                    )}
                  >
                    {experience.suitsWhom}
                  </p>
                </div>
              )}
            </ReportSection>
          )}
        </div>

        <aside className="min-w-0 space-y-8">
          <div>
            <p className={EYEBROW}>Internship overview</p>
            <h2 className={cn(SECTION_TITLE, "mt-1")}>Details</h2>
            <div className={cn(DIVIDER, "my-4")} aria-hidden="true" />
            <MetaGrid columns={1}>
              <MetaItem label="Domain" value={domainLabel} />
              <MetaItem label="Work mode" value={modeLabel} />
              <MetaItem label="Work nature" value={natureLabel} />
              <MetaItem label="Location" value={experience.location ?? undefined} />
              <MetaItem label="Duration" value={durationLabel} />
              <MetaItem label="Dates" value={dateRange} />
              <MetaItem label="Fee" value={formatFee(experience.feeAmount)} />
              <MetaItem label="Stipend" value={formatStipend(experience.stipendAmount)} />
            </MetaGrid>
          </div>

          <div>
            <p className={EYEBROW}>Verification</p>
            <h2 className={cn(SECTION_TITLE, "mt-1")}>Evidence</h2>
            <InsetPanel variant="neutral" className="mt-4">
              <MetaGrid columns={1}>
              <MetaItem label="Certificate">
                {experience.certificate ? (
                  <div className="space-y-1">
                    <span>
                      {experience.certificate.originalFilename} attached (private faculty evidence)
                    </span>
                    <a
                      href={experience.certificate.downloadUrl}
                      className={cn(
                        "inline-flex min-h-11 items-center text-sm font-semibold underline-offset-2 hover:underline",
                        INK,
                        FOCUS_RING,
                      )}
                    >
                      View uploaded file
                    </a>
                  </div>
                ) : (
                  "Not attached"
                )}
              </MetaItem>
              <MetaItem label="Application source" value={sourceLabel ?? undefined} />
              <MetaItem
                label="Mentor support"
                value={
                  experience.hadMentor
                    ? mentorFreqLabel
                      ? `Mentor available · ${mentorFreqLabel}`
                      : "Mentor available"
                    : "No dedicated mentor reported"
                }
              />
              {beginnerLabel && <MetaItem label="Beginner friendly" value={beginnerLabel} />}
              </MetaGrid>
            </InsetPanel>
          </div>
        </aside>
      </div>

      {(detailActions.length > 0 || statusNotice) && (
        <>
          <SheetDivider className="my-8" />
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          {statusNotice && (
            <p className={cn("text-sm font-medium", MUTED)} role="status">
              {statusNotice}
            </p>
          )}
          {detailActions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={cn(
                action.variant === "primary" ? BTN_PRIMARY : BTN_SECONDARY,
                "inline-flex min-h-11 w-full items-center justify-center px-5 sm:w-auto",
                MOTION,
                HOVER_LIFT,
                FOCUS_RING,
              )}
            >
              {action.label}
            </Link>
          ))}
          </div>
        </>
      )}

      <SheetDivider className="my-8" />

      <section aria-labelledby="experience-progress-heading">
        <SectionHeading title="Verification progress" description="Faculty review timeline." />
        <div className="mt-5 min-w-0">
          <Timeline entries={experience.timeline} />
        </div>
      </section>
      </EditorialSheet>
    </>
  );
}
