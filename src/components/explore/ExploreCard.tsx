import Link from "next/link";

import { CompanyMark } from "@/components/student/primitives";
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
  CARD_HOVER,
  CARD_ROLE,
  FOCUS_RING,
  HOVER_LIFT,
  INK,
  MOTION,
  MUTED,
  MUTED_LIGHT,
} from "./explore-ui";

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

export function ExploreCard({
  card,
  returnTo,
}: {
  card: ExploreCardType;
  returnTo?: string;
}) {
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

  const detailHref = returnTo
    ? `/student/explore/${card.id}?returnTo=${encodeURIComponent(returnTo)}`
    : `/student/explore/${card.id}`;

  return (
    <article className="flex h-full min-w-0 w-full flex-col">
      <Link
        href={detailHref}
        aria-label={`View verified experience: ${card.roleTitle} at ${card.companyName}`}
        className={cn(
          "group relative flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border border-[var(--il-border)] bg-[var(--il-white)]",
          CARD_HOVER,
          HOVER_LIFT,
          MOTION,
          FOCUS_RING,
        )}
      >
        <span
          className={cn(
            "absolute inset-x-0 top-0 h-[3px] bg-[var(--il-lime)] opacity-0",
            "group-hover:opacity-100 group-focus-visible:opacity-100",
            MOTION,
          )}
          aria-hidden="true"
        />

        {/* Identity zone */}
        <header className="flex shrink-0 gap-3 border-b border-[var(--il-border)] px-4 py-3.5 sm:px-5">
          <CompanyMark
            name={card.companyName}
            size="md"
            className="group-hover:bg-[color-mix(in_srgb,var(--il-moss)_90%,var(--il-ink))] group-hover:shadow-[0_0_0_2px_color-mix(in_srgb,var(--il-lime)_35%,transparent)]"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-x-2">
              <h3 className={cn("line-clamp-2 break-words", CARD_COMPANY)}>{card.companyName}</h3>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                  MUTED_LIGHT,
                )}
              >
                <VerifiedIcon className="opacity-60" />
                Verified
              </span>
            </div>
            <p className={cn("mt-1 line-clamp-2 break-words", CARD_ROLE)}>{card.roleTitle}</p>
            <p className={cn("mt-0.5 line-clamp-1 text-[11px] font-medium", MUTED)}>
              {domainLabel}
            </p>
          </div>
        </header>

        {/* Meta zone */}
        <div className="flex min-h-0 flex-1 flex-col px-4 py-3.5 sm:px-5">
          <dl className={cn("grid shrink-0 grid-cols-3 gap-x-2 text-[11px] sm:text-xs", MUTED)}>
            <div className="min-w-0">
              <dt className="sr-only">Location</dt>
              <dd className="inline-flex min-w-0 items-center gap-1">
                <MapPinIcon className="shrink-0 opacity-70" />
                <span className="truncate">{locationDisplay}</span>
              </dd>
            </div>
            <div className="min-w-0 text-center">
              <dt className="sr-only">Work mode</dt>
              <dd className="truncate">{modeLabel}</dd>
            </div>
            <div className="min-w-0 text-right">
              <dt className="sr-only">Duration</dt>
              <dd className="inline-flex items-center justify-end gap-1">
                <ClockIcon className="shrink-0 opacity-70" />
                {durationLabel}
              </dd>
            </div>
          </dl>

          <div className="mt-3 shrink-0">
            <span
              className={cn(
                "inline-flex max-w-full break-words rounded-lg px-2.5 py-1 text-[11px] font-semibold sm:text-xs",
                workNatureStyle(card.workNature),
              )}
            >
              {natureLabel}
            </span>
          </div>

          {/* Financial zone */}
          <div className="mt-3 shrink-0">
            <MoneyLine feeAmount={card.feeAmount} stipendAmount={card.stipendAmount} />
          </div>

          {/* Footer CTA zone */}
          <footer className="mt-auto shrink-0 border-t border-[var(--il-border)] pt-3">
            {card.beginnerFriendly === true && (
              <span className="inline-flex rounded-md border border-[color-mix(in_srgb,var(--il-lime)_40%,var(--il-border))] bg-[color-mix(in_srgb,var(--il-lime)_10%,var(--il-white))] px-2 py-0.5 text-[10px] font-semibold text-[var(--il-moss)]">
                Beginner friendly
              </span>
            )}
            {card.beginnerFriendly === false && (
              <span className={cn("text-[10px]", MUTED_LIGHT)}>
                Not marked beginner friendly
              </span>
            )}

            <p className={cn("mt-2 text-[11px] leading-relaxed break-words sm:text-xs", MUTED)}>
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
                "mt-2.5 inline-flex items-center gap-0.5 text-xs font-semibold",
                INK,
                "group-hover:text-[var(--il-moss)]",
                MOTION,
              )}
            >
              View reality card
              <ChevronRightIcon
                className={cn(
                  "motion-reduce:transition-none group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5",
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
