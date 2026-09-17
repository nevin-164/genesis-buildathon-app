import Link from "next/link";
import type { ReactNode } from "react";

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
  CARD_ROLE,
  DISPLAY_COMPANY,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  MUTED_LIGHT,
  PANEL,
  SECTION_HEADING,
} from "./explore-ui";

const CARD_PAD = "p-4 sm:p-5";
const SECTION_GAP = "space-y-4 sm:space-y-5";

function companyMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

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
      return "border border-[#0f1812]/15 border-l-[3px] border-l-[#c8ef5a] bg-[#0f1812] text-white";
    case "guided_project":
      return "border border-[#b8d4bc] bg-[#ecf8ee] text-[#2d5038]";
    case "training_only":
      return "border border-[#e5dfd0] bg-[#f7f5f0] text-[#6b6358]";
    default:
      return "border border-[#dde5dc] bg-[#f8faf8] text-[#5c6b62]";
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

function SnapshotCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[#dde5dc] bg-[#fafbf9] px-3 py-2.5">
      <p className={cn("text-[10px] font-medium tracking-wide", MUTED_LIGHT)}>{label}</p>
      <p className={cn("mt-1 flex min-w-0 items-center gap-1 text-sm font-medium leading-snug", INK)}>
        {icon}
        <span className="break-words">{value}</span>
      </p>
    </div>
  );
}

function LabelValue({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: ReactNode;
  valueClassName?: string;
}) {
  return (
    <div>
      <dt className={cn("text-xs font-medium", MUTED_LIGHT)}>{label}</dt>
      <dd className={cn("mt-0.5 text-sm leading-snug", INK, valueClassName)}>{value}</dd>
    </div>
  );
}

function SectionPanel({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(PANEL, CARD_PAD, "min-w-0", className)}>
      <h2 className={SECTION_HEADING}>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function ProcessTimeline({ steps }: { steps: string[] }) {
  return (
    <ol className="space-y-0" aria-label="Application steps">
      {steps.map((step, index) => (
        <li key={step} className="relative flex gap-3 pb-4 last:pb-0">
          <div className="flex w-6 shrink-0 flex-col items-center">
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full border border-[#cdd8cf]",
                "bg-[#f4f8f5] text-xs font-semibold text-[#2d5038]",
              )}
              aria-hidden="true"
            >
              {index + 1}
            </span>
            {index < steps.length - 1 && (
              <span
                className="mt-1 min-h-[1rem] w-px flex-1 bg-[#dde5dc]"
                aria-hidden="true"
              />
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

export function RealityCardView({ card }: { card: RealityCard }) {
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
    <article className={cn("w-full min-w-0", SECTION_GAP)}>
      <Link
        href="/student/explore"
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium",
          INK,
          "hover:text-[#2d5038] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        <ChevronRightIcon className="rotate-180" aria-hidden="true" />
        Back to Explore
      </Link>

      <header className={cn(PANEL, CARD_PAD, "relative overflow-hidden bg-[#f4f8f5]")}>
        <div
          className="pointer-events-none absolute bottom-4 left-0 top-4 w-1 rounded-full bg-[#c8ef5a]"
          aria-hidden="true"
        />
        <div className="min-w-0 pl-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-xs font-medium", MUTED_LIGHT)}>Reality Card</p>
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border border-[#b8d4bc] bg-[#ecf8ee]",
                "px-2 py-0.5 text-[10px] font-medium text-[#2d5038]",
              )}
            >
              <VerifiedIcon className="opacity-80" aria-hidden="true" />
              Verified student experience
            </span>
          </div>

          <p className={cn("mt-2 text-xs font-medium tracking-wide", MUTED_LIGHT)}>
            Inside this internship
          </p>

          <div className="mt-4 flex gap-3">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f1812] text-xs font-bold text-[#c8ef5a]"
              aria-hidden="true"
            >
              {companyMonogram(card.companyName)}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className={cn("text-lg sm:text-xl break-words", DISPLAY_COMPANY)}>
                {card.companyName}
              </h1>
              <p className={cn("mt-0.5 break-words", CARD_ROLE)}>{card.roleTitle}</p>
              <p className={cn("mt-1 text-sm", MUTED)}>{domainLabel}</p>
              <div
                className={cn(
                  "mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs",
                  MUTED,
                )}
              >
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
        </div>
      </header>

      <section className={cn(PANEL, CARD_PAD, "min-w-0")} aria-label="Reality snapshot">
        <h2 className={SECTION_HEADING}>At a glance</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          <SnapshotCell label="Work nature" value={natureLabel} />
          <SnapshotCell label="Work mode" value={modeLabel} />
          <SnapshotCell label="Location" value={locationDisplay} />
          <SnapshotCell label="Duration" value={durationLabel} />
          <SnapshotCell label="Fee" value={formatFee(card.feeAmount)} />
          <SnapshotCell label="Stipend" value={formatStipend(card.stipendAmount)} />
          {experienceLevel && (
            <SnapshotCell label="Experience level" value={experienceLevel} />
          )}
        </div>
        <div className="mt-3">
          <span
            className={cn(
              "inline-flex rounded-md px-2.5 py-1 text-xs font-semibold",
              workNatureStyle(card.workNature),
            )}
          >
            {natureLabel}
          </span>
        </div>
      </section>

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_17.5rem] lg:items-start">
        <div className={cn("min-w-0", SECTION_GAP)}>
          <SectionPanel title="Work and responsibilities">
            <dl className="space-y-4">
              {card.projectTitle && (
                <LabelValue label="Project" value={card.projectTitle} valueClassName="font-medium" />
              )}
              <div>
                <dt className={cn("text-xs font-medium", MUTED_LIGHT)}>
                  What the student worked on
                </dt>
                <dd className={cn("mt-1 text-sm leading-relaxed break-words", MUTED)}>
                  {card.workSummary}
                </dd>
              </div>
              {card.technologies.length > 0 && (
                <div>
                  <dt className={cn("text-xs font-medium", MUTED_LIGHT)}>Technologies used</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    <SkillChips labels={card.technologies} />
                  </dd>
                </div>
              )}
            </dl>
          </SectionPanel>

          {showSkills && (
            <SectionPanel title="Skills gained during the internship">
              <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-stretch">
                <div className="min-w-0 rounded-lg border border-[#dde5dc] bg-[#fafbf9] p-4">
                  <h3 className={cn("text-sm font-semibold", INK)}>Before the internship</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {card.skillsBefore.length > 0 ? (
                      <SkillChips labels={card.skillsBefore} />
                    ) : (
                      <p className={cn("text-sm", MUTED)}>Not provided</p>
                    )}
                  </div>
                </div>
                <div
                  className="hidden items-center justify-center text-[#8a968d] md:flex"
                  aria-hidden="true"
                >
                  <ChevronRightIcon />
                </div>
                <div className="min-w-0 rounded-lg border border-[#c8ef5a]/30 bg-[#f4faf0] p-4">
                  <h3 className={cn("text-sm font-semibold", INK)}>By the end of the internship</h3>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {card.skillsAfter.length > 0 ? (
                      <SkillChips labels={card.skillsAfter} />
                    ) : (
                      <p className={cn("text-sm", MUTED)}>Not provided</p>
                    )}
                  </div>
                </div>
              </div>
            </SectionPanel>
          )}

          {(showMentorship || showApplication) && (
            <div className="grid min-w-0 gap-4 md:grid-cols-2">
              {showMentorship && (
                <SectionPanel title="Mentorship and support" className="h-full">
                  <dl className="space-y-3">
                    <LabelValue
                      label="Mentor provided"
                      value={
                        card.hadMentor
                          ? "Dedicated mentor available"
                          : "No dedicated mentor reported"
                      }
                    />
                    {card.hadMentor && mentorFreqLabel && (
                      <LabelValue
                        label="Interaction frequency"
                        value={`Mentor interaction: ${mentorFreqLabel}`}
                      />
                    )}
                  </dl>
                </SectionPanel>
              )}

              {showApplication && (
                <SectionPanel
                  title="How the student secured this internship"
                  className="h-full"
                >
                  <dl className="space-y-4">
                    {sourceLabel && (
                      <LabelValue label="Application channel" value={sourceLabel} />
                    )}
                    {processSteps.length > 0 && (
                      <div>
                        <dt className={cn("text-xs font-medium", MUTED_LIGHT)}>
                          Application process
                        </dt>
                        <dd className="mt-2">
                          <ProcessTimeline steps={processSteps} />
                        </dd>
                      </div>
                    )}
                  </dl>
                </SectionPanel>
              )}
            </div>
          )}

          {showOutcome && (
            <SectionPanel title="Who would benefit from this internship?">
              <dl className="space-y-3">
                {experienceLevel && (
                  <LabelValue label="Experience level" value={experienceLevel} />
                )}
                {card.suitsWhom?.trim() && (
                  <dd className={cn("text-sm leading-relaxed break-words", MUTED)}>
                    {card.suitsWhom}
                  </dd>
                )}
              </dl>
            </SectionPanel>
          )}
        </div>

        <aside
          className={cn(
            PANEL,
            CARD_PAD,
            "h-fit min-w-0 lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto",
          )}
        >
          <h2 className={SECTION_HEADING}>Experience verification</h2>

          <div
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-md border border-[#b8d4bc] bg-[#ecf8ee]",
              "px-2.5 py-1 text-xs font-medium text-[#2d5038]",
            )}
          >
            <VerifiedIcon className="shrink-0 opacity-80" aria-hidden="true" />
            Verified student experience
          </div>

          <dl className={cn("mt-4 space-y-3 text-sm", MUTED)}>
            <LabelValue label="Shared by" value={card.studentName} valueClassName="font-medium" />
            {card.studentBatch && (
              <LabelValue label="Batch" value={card.studentBatch} />
            )}
            <LabelValue
              label="Internship completed"
              value={formatDisplayDate(card.endDate)}
            />
            <LabelValue label="Verified by" value={card.verifiedByName} />
            <LabelValue
              label="Verification date"
              value={formatDisplayDate(card.verifiedAt)}
            />
          </dl>
        </aside>
      </div>
    </article>
  );
}
