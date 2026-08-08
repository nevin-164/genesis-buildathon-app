import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { exploreDisplay } from "@/components/explore/explore-font";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  CARD_COMPANY,
  CARD_ROLE,
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  MUTED_LIGHT,
  PANEL,
} from "@/components/explore/explore-ui";
import { Badge } from "@/components/ui";
import {
  EXPERIENCE_STATUS_LABEL,
  EXPERIENCE_STATUS_TONE,
} from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { ExperienceListItem } from "@/types/contracts";

import {
  experiencePrimaryAction,
  experienceSecondaryAction,
  experienceStatusDescription,
  experienceStatusHeadline,
} from "./experience-workflow";

function formatDisplayDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSubmitted(experience: ExperienceListItem): string {
  if (experience.submittedAt) return formatDisplayDate(experience.submittedAt);
  if (experience.status === "draft") return "Not submitted yet";
  return "—";
}

function companyMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function ExperienceStatusCard({ experience }: { experience: ExperienceListItem }) {
  const primary = experiencePrimaryAction(experience);
  const secondary = experienceSecondaryAction(experience);
  const headline = experienceStatusHeadline(experience.status);
  const description = experienceStatusDescription(experience.status);

  return (
    <article
      className={cn(
        PANEL,
        "relative flex h-full w-full min-w-0 flex-col overflow-hidden p-0",
        experience.status === "verified" && "border-[#b8d4bc] bg-[#f4f8f5]",
        experience.status === "changes_requested" && "border-amber-200/80",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5",
          experience.status === "changes_requested"
            ? "bg-amber-400"
            : experience.status === "verified"
              ? "bg-[#c8ef5a]"
              : experience.status === "rejected"
                ? "bg-red-300"
                : "bg-[#c8ef5a]/70",
        )}
        aria-hidden="true"
      />

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <header className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className={cn("text-xs font-semibold uppercase tracking-[0.12em]", MUTED_LIGHT)}>
              {headline}
            </p>
            <Badge tone={EXPERIENCE_STATUS_TONE[experience.status]}>
              {EXPERIENCE_STATUS_LABEL[experience.status]}
            </Badge>
          </div>

          <div className="mt-3 flex gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f1812] text-xs font-bold text-[#c8ef5a]"
              aria-hidden="true"
            >
              {companyMonogram(experience.companyName)}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className={cn("break-words", CARD_COMPANY, exploreDisplay.className)}>
                {experience.companyName}
              </h2>
              <p className={cn("mt-0.5 break-words", CARD_ROLE)}>{experience.roleTitle}</p>
            </div>
          </div>

          {description && (
            <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>{description}</p>
          )}

          <p className={cn("mt-2 text-xs", MUTED)}>
            Submitted: <span className={INK}>{formatSubmitted(experience)}</span>
          </p>
        </header>

        {experience.latestReason?.trim() &&
          (experience.status === "changes_requested" || experience.status === "rejected") && (
            <div
              className={cn(
                "mt-4 rounded-lg border px-3 py-2.5",
                experience.status === "rejected"
                  ? "border-red-200/80 bg-red-50/40"
                  : "border-amber-200/80 bg-amber-50/60",
              )}
            >
              <p className={cn("text-xs font-semibold uppercase tracking-wide", MUTED_LIGHT)}>
                Faculty feedback
              </p>
              <p className="mt-1 text-sm leading-relaxed break-words text-[#3d4a42]">
                {experience.latestReason}
              </p>
            </div>
          )}

        <footer className="mt-auto flex flex-col gap-2 border-t border-[#e4ebe4] pt-4 sm:flex-row">
          <Link
            href={primary.href}
            className={cn(
              primary.variant === "primary" ? BTN_PRIMARY : BTN_GHOST,
              "inline-flex min-h-11 w-full items-center justify-center gap-1 px-4 py-2.5 text-sm sm:w-auto",
              MOTION,
              FOCUS_RING,
            )}
          >
            {primary.label}
            <ChevronRightIcon aria-hidden="true" />
          </Link>
          {secondary && (
            <Link
              href={secondary.href}
              className={cn(
                BTN_GHOST,
                "inline-flex min-h-11 w-full items-center justify-center gap-1 px-4 py-2.5 text-sm sm:w-auto",
                MOTION,
                FOCUS_RING,
              )}
            >
              {secondary.label}
            </Link>
          )}
        </footer>
      </div>
    </article>
  );
}
