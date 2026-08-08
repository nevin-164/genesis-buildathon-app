import Link from "next/link";
import type { ReactNode } from "react";

import {
  BackLink,
  CompanyMark,
  DefinitionStrip,
  EditorialSheet,
  InsetPanel,
  SectionHeading,
  SheetDivider,
} from "@/components/student/primitives";
import { DISPLAY_TITLE_SM } from "@/components/student/student-ui";
import {
  APPLICATION_SOURCES,
  DOMAINS,
  MENTOR_FREQUENCIES,
  WORK_MODES,
  WORK_NATURES,
  labelFor,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { RealityCard, WorkNature } from "@/types/contracts";

import {
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  VerifiedIcon,
} from "./explore-icons";
import { formatFee, formatStipend } from "./MoneyLine";
import { SkillChips } from "./SkillChips";
import {
  BTN_SECONDARY,
  CARD_ROLE,
  EYEBROW,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  SECTION_TITLE,
} from "./explore-ui";

function formatDisplayDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function workNatureStyle(nature: WorkNature): string {
  switch (nature) {
    case "real_work":
      return "border border-[color-mix(in_srgb,var(--il-ink)_15%,transparent)] border-l-[3px] border-l-[var(--il-lime)] bg-[var(--il-ink)] text-[var(--il-ivory)]";
    case "guided_project":
      return "border border-[color-mix(in_srgb,var(--il-leaf)_35%,var(--il-border))] bg-[color-mix(in_srgb,var(--il-lime)_10%,var(--il-white))] text-[var(--il-moss)]";
    case "training_only":
      return "border border-[var(--il-border)] bg-[var(--il-ivory)] text-[var(--il-muted)]";
    default:
      return "border border-[var(--il-border)] bg-[var(--il-canvas)] text-[var(--il-muted)]";
  }
}

function experienceLevelLabel(value: boolean | null): string | null {
  if (value === true) return "Beginner-friendly";
  if (value === false) return "Not marked as beginner-friendly";
  return null;
}

function parseProcessSteps(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const numbered = trimmed.split(/\d+[.)]\s+/).filter(Boolean);
  if (numbered.length > 1) {
    return numbered.map((step) => step.replace(/\.$/, "").trim()).filter(Boolean);
  }

  const byPeriod = trimmed
    .split(/\.\s+/)
    .map((step) => step.replace(/\.$/, "").trim())
    .filter(Boolean);
  if (byPeriod.length > 1) return byPeriod;

  const byComma = trimmed
    .split(/,\s+/)
    .map((step) => step.replace(/\.$/, "").trim())
    .filter(Boolean);
  if (byComma.length > 1) return byComma;

  return [trimmed.replace(/\.$/, "").trim()];
}

function VerticalLabelBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <section className="relative min-w-0 pl-4 sm:pl-5">
      <div
        className="absolute bottom-0 left-0 top-0 w-0.5 bg-[var(--il-lime)]"
        aria-hidden="true"
      />
      <p className={EYEBROW}>{label}</p>
      <div className={cn("mt-2 text-sm leading-relaxed break-words", MUTED)}>{children}</div>
    </section>
  );
}

function ProcessTimeline({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-0" aria-label="Application steps">
      {steps.map((step, index) => (
        <li key={step} className="relative flex gap-3 pb-3 last:pb-0">
          <div className="flex w-6 shrink-0 flex-col items-center">
            <span
              className="flex h-6 w-6 items-center justify-center rounded-full border border-[var(--il-border)] bg-[var(--il-canvas)] text-[11px] font-bold text-[var(--il-moss)]"
              aria-hidden="true"
            >
              {index + 1}
            </span>
            {index < steps.length - 1 && (
              <span className="mt-1 w-px flex-1 bg-[var(--il-border)]" aria-hidden="true" />
            )}
          </div>
          <p className={cn("min-w-0 flex-1 pt-0.5 text-sm leading-relaxed break-words", MUTED)}>
            {step}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function RealityCardView({
  card,
  backHref = "/student/explore",
  compareHref,
}: {
  card: RealityCard;
  backHref?: string;
  compareHref?: string;
}) {
  const domainLabel = labelFor(DOMAINS, card.domain);
  const modeLabel = labelFor(WORK_MODES, card.workMode);
  const natureLabel = labelFor(WORK_NATURES, card.workNature);
  const locationDisplay =
    card.location ?? (card.workMode === "remote" ? "Remote" : "Not provided");
  const dateRange = `${formatDisplayDate(card.startDate)} – ${formatDisplayDate(card.endDate)}`;
  const durationLabel = `${card.durationWeeks} ${card.durationWeeks === 1 ? "week" : "weeks"}`;
  const sourceLabel = card.applicationSource
    ? labelFor(APPLICATION_SOURCES, card.applicationSource)
    : null;
  const mentorFreqLabel = card.mentorFrequency
    ? labelFor(MENTOR_FREQUENCIES, card.mentorFrequency)
    : null;
  const experienceLevel = experienceLevelLabel(card.beginnerFriendly);
  const processSteps = card.applicationProcess?.trim()
    ? parseProcessSteps(card.applicationProcess)
    : [];

  const showMentorship = card.hadMentor || card.mentorFrequency !== null;
  const showApplication = Boolean(sourceLabel || processSteps.length > 0);
  const showOutcome = Boolean(card.suitsWhom?.trim() || experienceLevel);
  const showSkills = card.skillsBefore.length > 0 || card.skillsAfter.length > 0;

  return (
    <article className="w-full min-w-0">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <BackLink href={backHref} label="Back to Explore" />
        {compareHref && (
          <Link
            href={compareHref}
            className={cn(
              BTN_SECONDARY,
              "inline-flex min-h-11 w-full items-center justify-center text-sm sm:w-auto",
              MOTION,
              FOCUS_RING,
            )}
          >
            Compare with others
          </Link>
        )}
      </div>

      <EditorialSheet className="mt-4 space-y-8 sm:space-y-10">
      {/* Asymmetric masthead */}
      <header className="relative min-w-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <CompanyMark name={card.companyName} size="xl" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={EYEBROW}>Reality Card</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--il-moss)]">
                  <VerifiedIcon className="opacity-80" aria-hidden="true" />
                  Verified
                </span>
              </div>
              <h1 className={cn(DISPLAY_TITLE_SM, "mt-1 break-words")}>{card.companyName}</h1>
              <p className={cn("mt-1 break-words", CARD_ROLE)}>{card.roleTitle}</p>
              <p className={cn("mt-1 text-sm", MUTED)}>{domainLabel}</p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-start gap-2 lg:items-end">
            <span
              className={cn(
                "inline-flex rounded-lg px-3 py-1.5 text-xs font-bold",
                workNatureStyle(card.workNature),
              )}
            >
              {natureLabel}
            </span>
            <div className={cn("flex flex-wrap items-center gap-x-3 gap-y-1 text-xs", MUTED)}>
              <span className="inline-flex min-w-0 items-center gap-1">
                <MapPinIcon className="shrink-0 opacity-70" aria-hidden="true" />
                <span className="break-words">{locationDisplay}</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>{modeLabel}</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex min-w-0 items-center gap-1">
                <ClockIcon className="shrink-0 opacity-70" aria-hidden="true" />
                <span className="break-words">
                  {dateRange} ({durationLabel})
                </span>
              </span>
            </div>
          </div>
        </div>
        <div className="mt-5 h-0.5 w-16 bg-[var(--il-lime)]" aria-hidden="true" />
      </header>

      <SheetDivider />

      {/* Facts ribbon */}
      <DefinitionStrip
        items={[
          { label: "Work nature", value: natureLabel },
          { label: "Work mode", value: modeLabel },
          { label: "Location", value: locationDisplay },
          { label: "Duration", value: durationLabel },
          { label: "Fee", value: formatFee(card.feeAmount) },
          { label: "Stipend", value: formatStipend(card.stipendAmount) },
          ...(experienceLevel ? [{ label: "Experience level", value: experienceLevel }] : []),
        ]}
      />

      {/* Lead story with vertical label */}
      <VerticalLabelBlock label="What the student worked on">
        {card.projectTitle && (
          <p className={cn("mb-2 font-semibold", INK)}>{card.projectTitle}</p>
        )}
        {card.workSummary}
      </VerticalLabelBlock>

      {card.technologies.length > 0 && (
        <>
          <SheetDivider />
          <section className="min-w-0">
          <SectionHeading title="Technologies used" />
          <div className="mt-3">
            <SkillChips labels={card.technologies} />
          </div>
          </section>
        </>
      )}

      {/* Before / after skill columns */}
      {showSkills && (
        <>
          <SheetDivider />
          <section className="min-w-0" aria-labelledby="skills-gained-heading">
          <SectionHeading
            title="Skills gained during the internship"
            description="What the student knew going in versus what they could do by the end."
          />
          <div
            id="skills-gained-heading"
            className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-start sm:gap-3"
          >
            <div className="min-w-0">
              <h3 className={cn(SECTION_TITLE, "text-sm")}>Before</h3>
              <div className="mt-2">
                {card.skillsBefore.length > 0 ? (
                  <SkillChips labels={card.skillsBefore} />
                ) : (
                  <p className={cn("text-sm", MUTED)}>Not provided</p>
                )}
              </div>
            </div>
            <div
              className="flex items-center justify-center py-1 text-[var(--il-muted)] sm:pt-6"
              aria-hidden="true"
            >
              <ChevronRightIcon className="rotate-90 sm:rotate-0" />
            </div>
            <div className="min-w-0">
              <h3 className={cn(SECTION_TITLE, "text-sm")}>After</h3>
              <div className="mt-2">
                {card.skillsAfter.length > 0 ? (
                  <SkillChips labels={card.skillsAfter} />
                ) : (
                  <p className={cn("text-sm", MUTED)}>Not provided</p>
                )}
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* Mentorship & application pathway */}
      {(showMentorship || showApplication) && (
        <>
          <SheetDivider />
          <div className="grid min-w-0 gap-6 sm:grid-cols-2">
          {showMentorship && (
            <section className="min-w-0">
              <SectionHeading title="Mentorship and support" />
              <dl className="mt-3 space-y-3">
                <div>
                  <dt className={EYEBROW}>Mentor provided</dt>
                  <dd className={cn("mt-1 text-sm", INK)}>
                    {card.hadMentor
                      ? "Dedicated mentor available"
                      : "No dedicated mentor reported"}
                  </dd>
                </div>
                {card.hadMentor && mentorFreqLabel && (
                  <div>
                    <dt className={EYEBROW}>Interaction frequency</dt>
                    <dd className={cn("mt-1 text-sm", INK)}>{mentorFreqLabel}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {showApplication && (
            <section className="min-w-0">
              <SectionHeading title="How they secured this internship" />
              <dl className="mt-3 space-y-3">
                {sourceLabel && (
                  <div>
                    <dt className={EYEBROW}>Application channel</dt>
                    <dd className={cn("mt-1 text-sm", INK)}>{sourceLabel}</dd>
                  </div>
                )}
                {processSteps.length > 0 && (
                  <div>
                    <dt className={EYEBROW}>Application pathway</dt>
                    <dd className="mt-2">
                      <ProcessTimeline steps={processSteps} />
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>
        </>
      )}

      {/* Who would benefit — highlighted */}
      {showOutcome && (
        <>
          <SheetDivider />
          <InsetPanel variant="mint" className="p-4 sm:p-5">
          <SectionHeading title="Who would benefit from this internship?" />
          <div className="mt-3 space-y-2">
            {experienceLevel && (
              <p className={cn("text-sm font-semibold", INK)}>{experienceLevel}</p>
            )}
            {card.suitsWhom?.trim() && (
              <p className={cn("text-sm leading-relaxed break-words", MUTED)}>{card.suitsWhom}</p>
            )}
          </div>
        </InsetPanel>
        </>
      )}

      {/* Compact trust footer */}
      <SheetDivider />
      <footer>
        <p className={EYEBROW}>Experience verification</p>
        <dl className="mt-3 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
              Shared by
            </dt>
            <dd className={cn("mt-0.5 text-sm font-medium", INK)}>{card.studentName}</dd>
          </div>
          {card.studentBatch && (
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
                Batch
              </dt>
              <dd className={cn("mt-0.5 text-sm font-medium", INK)}>{card.studentBatch}</dd>
            </div>
          )}
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
              Completed
            </dt>
            <dd className={cn("mt-0.5 text-sm font-medium", INK)}>
              {formatDisplayDate(card.endDate)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--il-muted)]">
              Verified by
            </dt>
            <dd className={cn("mt-0.5 text-sm font-medium", INK)}>
              {card.verifiedByName}
              <span className={cn("block text-xs font-normal", MUTED)}>
                {formatDisplayDate(card.verifiedAt)}
              </span>
            </dd>
          </div>
        </dl>
      </footer>
      </EditorialSheet>
    </article>
  );
}
