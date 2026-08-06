import Link from "next/link";

import { DOMAINS, WORK_NATURES, labelFor } from "@/lib/constants/options";
import { cn } from "@/lib/cn";
import type { ExploreCard as ExploreCardType, WorkNature } from "@/types/contracts";

import {
  ChevronRightIcon,
  ClockIcon,
  MapPinIcon,
  VerifiedIcon,
} from "./explore-icons";
import { MoneyLine } from "./MoneyLine";
import {
  CARD_COMPANY,
  CARD_ROLE,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  MUTED_LIGHT,
  PANEL,
} from "./explore-ui";

function companyMonogram(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
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

export function ExploreCard({ card }: { card: ExploreCardType }) {
  const natureLabel = labelFor(WORK_NATURES, card.workNature);
  const domainLabel = labelFor(DOMAINS, card.domain);
  const locationDisplay = card.location ?? (card.workMode === "remote" ? "Remote" : "—");
  const durationLabel = `${card.durationWeeks} ${card.durationWeeks === 1 ? "wk" : "wks"}`;
  const modeLabel =
    card.workMode === "remote"
      ? "Remote"
      : card.workMode === "hybrid"
        ? "Hybrid"
        : "On-site";

  return (
    <article className="h-full">
      <Link
        href={`/student/explore/${card.id}`}
        aria-label={`View verified experience: ${card.roleTitle} at ${card.companyName}`}
        className={cn(
          PANEL,
          "group relative flex h-full flex-col overflow-hidden p-0",
          "border-[#cdd8cf]",
          "hover:-translate-y-[2px] hover:border-[#a8c99a] hover:shadow-[0_12px_32px_rgba(15,24,18,0.10)]",
          "focus-within:-translate-y-[2px] focus-within:border-[#a8c99a] focus-within:shadow-[0_12px_32px_rgba(15,24,18,0.10)]",
          "motion-reduce:hover:translate-y-0 motion-reduce:focus-within:translate-y-0",
          MOTION,
          FOCUS_RING,
        )}
      >
        {/* Lime accent line — visible on hover/focus */}
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-0.5 bg-[#c8ef5a] opacity-0",
            "group-hover:opacity-100 group-focus-within:opacity-100",
            MOTION,
          )}
          aria-hidden="true"
        />

        {/* Identity header */}
        <header className="relative border-b border-[#e4ebe4] bg-gradient-to-br from-[#f4f8f5] to-[#eef4ef] px-3.5 py-3">
          <div className="flex gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                "bg-[#0f1812] text-xs font-bold tracking-wide text-[#c8ef5a]",
                "group-hover:bg-[#1a2e22] group-hover:shadow-[0_0_0_2px_rgba(200,239,90,0.35)]",
                MOTION,
              )}
              aria-hidden="true"
            >
              {companyMonogram(card.companyName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-0.5">
                <h3 className={cn("truncate", CARD_COMPANY)}>{card.companyName}</h3>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-0.5 text-[9px] font-medium uppercase tracking-[0.12em]",
                    MUTED_LIGHT,
                  )}
                >
                  <VerifiedIcon className="opacity-60" />
                  Verified
                </span>
              </div>
              <p className={cn("mt-1 line-clamp-1", CARD_ROLE)}>{card.roleTitle}</p>
              <p className={cn("mt-0.5 text-[11px] font-medium", MUTED)}>{domainLabel}</p>
            </div>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-3 px-3.5 py-3">
          {/* Metadata row */}
          <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px]", MUTED)}>
            <span className="inline-flex items-center gap-1">
              <MapPinIcon className="shrink-0 opacity-70" />
              {locationDisplay}
            </span>
            <span aria-hidden="true" className="text-[#cdd8cf]">
              ·
            </span>
            <span>{modeLabel}</span>
            <span aria-hidden="true" className="text-[#cdd8cf]">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <ClockIcon className="shrink-0 opacity-70" />
              {durationLabel}
            </span>
          </div>

          {/* Work nature */}
          <div>
            <span
              className={cn(
                "inline-flex rounded-md px-2.5 py-1 text-[11px] font-semibold",
                workNatureStyle(card.workNature),
              )}
            >
              {natureLabel}
            </span>
          </div>

          <MoneyLine feeAmount={card.feeAmount} stipendAmount={card.stipendAmount} />

          <footer className="mt-auto space-y-2 border-t border-[#e4ebe4] pt-2.5">
            {card.beginnerFriendly === true && (
              <span className="inline-flex rounded border border-[#c8ef5a]/40 bg-[#f0fae8] px-1.5 py-0.5 text-[10px] font-medium text-[#3d5210]">
                Beginner friendly
              </span>
            )}
            {card.beginnerFriendly === false && (
              <span className={cn("text-[10px]", MUTED_LIGHT)}>Not marked beginner friendly</span>
            )}

            <p className={cn("text-[10px] leading-relaxed", MUTED)}>
              Shared by{" "}
              <span className={cn("font-semibold", INK)}>{card.studentName}</span>
              <span aria-hidden="true"> · </span>
              {card.year}
              {card.studentBatch && (
                <>
                  <span aria-hidden="true"> · </span>
                  {card.studentBatch}
                </>
              )}
            </p>

            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                INK,
                "group-hover:text-[#2d5038]",
                MOTION,
              )}
            >
              View reality card
              <ChevronRightIcon
                className={cn(
                  "motion-reduce:transition-none group-hover:translate-x-0.5 group-focus-within:translate-x-0.5",
                  MOTION,
                )}
              />
            </span>
          </footer>
        </div>
      </Link>
    </article>
  );
}
