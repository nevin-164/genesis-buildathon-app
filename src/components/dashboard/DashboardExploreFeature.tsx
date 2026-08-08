import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import {
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";

import { DocumentMotifIcon } from "./dashboard-icons";
import { DASH_CARD_HOVER, DASH_CARD_PAD } from "./dashboard-utils";

export function DashboardExploreFeature() {
  return (
    <section
      className={cn(
        PANEL,
        DASH_CARD_PAD,
        DASH_CARD_HOVER,
        "group relative min-w-0 overflow-hidden",
        MOTION,
      )}
      aria-labelledby="dashboard-explore-heading"
    >
      <div
        className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full border border-[#c8ef5a]/20 bg-[#f0fae8]/60"
        aria-hidden="true"
      />

      <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 gap-3.5">
          <div
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#b8d4bc] bg-[#ecf8ee] text-[#2d5038]",
              "motion-reduce:transition-none group-hover:-translate-y-0.5 group-hover:border-[#c8ef5a]/50 group-hover:shadow-[0_6px_16px_rgba(15,24,18,0.08)]",
              MOTION,
            )}
            aria-hidden="true"
          >
            <DocumentMotifIcon />
          </div>

          <div className="min-w-0">
            <h2
              id="dashboard-explore-heading"
              className={cn(DISPLAY_SECTION, "text-base sm:text-lg")}
            >
              Learn from verified experiences
            </h2>
            <p className={cn("mt-1.5 max-w-prose text-sm leading-relaxed", MUTED)}>
              Reality Cards are honest write-ups from FISAT students about what an internship
              was really like — the work, costs, mentorship, and outcomes — verified by faculty.
            </p>
          </div>
        </div>

        <Link
          href="/student/explore"
          className={cn(
            "inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-1 rounded-lg border border-[#cdd8cf] bg-white px-4 py-2.5 text-sm font-semibold sm:w-auto",
            INK,
            MOTION,
            FOCUS_RING,
            "hover:border-[#c8ef5a]/50 hover:bg-[#f4f8f5] active:bg-[#eef4ef]",
            "motion-reduce:hover:translate-y-0 hover:-translate-y-px hover:shadow-[0_4px_14px_rgba(15,24,18,0.07)]",
          )}
        >
          Browse Reality Cards
          <ChevronRightIcon aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
