import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import { exploreDisplay } from "@/components/explore/explore-font";
import {
  BTN_PRIMARY,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { cn } from "@/lib/cn";

import { DASH_CARD_PAD, firstNameFromFullName } from "./dashboard-utils";

function WelcomeDecoration() {
  return (
    <div
      className="relative mx-auto hidden h-[7.5rem] w-full max-w-[15rem] sm:block lg:mx-0 lg:h-[8.5rem] lg:max-w-[13.5rem]"
      aria-hidden="true"
    >
      <div className="absolute right-10 top-1 h-[4.5rem] w-[7.5rem] rotate-[-7deg] rounded-xl border border-[#dde5dc] bg-[#faf8f4] shadow-[0_4px_14px_rgba(15,24,18,0.06)]" />
      <div className="absolute right-5 top-5 h-[4.5rem] w-[7.5rem] rotate-[4deg] rounded-xl border border-[#b8d4bc] bg-[#ecf8ee] shadow-[0_6px_18px_rgba(15,24,18,0.08)]" />
      <div className="absolute right-0 top-9 h-[4.75rem] w-[7.75rem] rounded-xl border border-[#0f1812]/10 bg-[#0f1812] p-3 shadow-[0_10px_24px_rgba(15,24,18,0.18)]">
        <div className="h-1 w-7 rounded-full bg-[#c8ef5a]" />
        <div className="mt-2.5 space-y-1.5">
          <div className="h-1 w-full rounded-full bg-white/22" />
          <div className="h-1 w-4/5 rounded-full bg-white/16" />
          <div className="h-1 w-3/5 rounded-full bg-white/12" />
        </div>
      </div>
      <div className="absolute left-2 top-3 h-2.5 w-2.5 rounded-sm bg-[#c8ef5a]" />
      <div className="absolute bottom-2 left-8 h-6 w-6 rounded-full border-2 border-[#c8ef5a]/35 bg-[#f4f8f5]" />
    </div>
  );
}

export function DashboardWelcome({ fullName }: { fullName: string | null }) {
  const firstName = fullName ? firstNameFromFullName(fullName) : null;

  return (
    <header
      className={cn(
        PANEL,
        "relative min-w-0 overflow-hidden bg-[#f4f8f5]",
        DASH_CARD_PAD,
      )}
    >
      <div
        className="pointer-events-none absolute bottom-4 left-0 top-4 w-1 rounded-full bg-[#c8ef5a]"
        aria-hidden="true"
      />

      <div className="grid min-w-0 gap-5 pl-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <p className={cn("text-xs font-medium tracking-wide", MUTED)}>Student dashboard</p>
          <h1
            className={cn(
              exploreDisplay.className,
              "mt-1 text-[1.625rem] font-bold leading-[1.15] tracking-[-0.025em] sm:text-[1.875rem] lg:text-[2rem]",
              INK,
            )}
          >
            {firstName ? (
              <>
                Welcome back,{" "}
                <span className="break-words text-[#2d5038]">{firstName}</span>
              </>
            ) : (
              "Welcome back"
            )}
          </h1>
          <p className={cn("mt-2 max-w-xl text-sm leading-relaxed sm:text-[15px]", MUTED)}>
            Track your internship application, respond when faculty need something from you,
            and learn from verified student experiences.
          </p>
          <Link
            href="/student/explore"
            className={cn(
              BTN_PRIMARY,
              "mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1 px-5 py-2.5 sm:w-auto",
              MOTION,
              FOCUS_RING,
            )}
          >
            Explore internships
            <ChevronRightIcon aria-hidden="true" />
          </Link>
        </div>

        <WelcomeDecoration />
      </div>
    </header>
  );
}
