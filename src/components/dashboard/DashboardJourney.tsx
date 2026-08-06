import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import {
  BTN_PRIMARY,
  DISPLAY_SECTION,
  FOCUS_RING,
  MOTION,
  MUTED,
  MUTED_LIGHT,
  PANEL,
} from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";
import type { StudentDashboard } from "@/types/contracts";

import { latestActionReason, resolveNextStep } from "./dashboard-next-step";
import { DASH_CARD_HOVER, DASH_CARD_PAD } from "./dashboard-utils";

export function DashboardJourney({ dashboard }: { dashboard: StudentDashboard }) {
  const step = resolveNextStep(dashboard);
  const reason = latestActionReason(dashboard);
  const isClarification = dashboard.nextAction === "respond_clarification";
  const isRejected = dashboard.nextAction === "rejected";
  const isFixExperience = dashboard.nextAction === "fix_experience";

  return (
    <section
      className={cn(
        PANEL,
        DASH_CARD_PAD,
        DASH_CARD_HOVER,
        "relative min-w-0 overflow-hidden",
        MOTION,
        step.urgent && !isClarification && "border-amber-200/80 bg-amber-50/25",
        isClarification && "border-amber-200/70 bg-[#fffbf5]",
      )}
      aria-labelledby="dashboard-journey-heading"
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-0.5",
          isClarification || isFixExperience
            ? "bg-amber-400"
            : isRejected
              ? "bg-red-300"
              : "bg-[#c8ef5a]",
        )}
        aria-hidden="true"
      />

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          {step.urgent && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-800">
              Action required
            </p>
          )}

          <h2
            id="dashboard-journey-heading"
            className={cn(DISPLAY_SECTION, "mt-1 text-lg sm:text-xl")}
          >
            {step.title}
          </h2>
          <p className={cn("mt-2 max-w-prose text-sm leading-relaxed", MUTED)}>{step.text}</p>

          {reason && (
            <div
              className={cn(
                "mt-3 rounded-lg border px-3 py-2.5",
                isRejected
                  ? "border-red-200/80 bg-red-50/50"
                  : "border-amber-200/70 bg-amber-50/70",
              )}
            >
              <p className={cn("text-[10px] font-semibold uppercase tracking-wide", MUTED_LIGHT)}>
                {isRejected ? "Feedback" : "Faculty message"}
              </p>
              <p className="mt-1 text-sm leading-relaxed break-words text-[#3d4a42]">{reason}</p>
            </div>
          )}
        </div>

        <Link
          href={step.href}
          className={cn(
            BTN_PRIMARY,
            "inline-flex min-h-11 shrink-0 items-center justify-center gap-1 self-start px-5 py-2.5 sm:min-w-[10.5rem]",
            MOTION,
            FOCUS_RING,
          )}
        >
          {step.cta}
          <ChevronRightIcon aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
