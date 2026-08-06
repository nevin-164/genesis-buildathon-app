import Link from "next/link";

import { cn } from "@/lib/cn";

import { ChevronRightIcon } from "./explore-icons";
import { exploreDisplay } from "./explore-font";
import {
  DISPLAY_HERO,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "./explore-ui";

export function CompareIntro() {
  return (
    <header
      className={cn(
        PANEL,
        "relative min-w-0 overflow-hidden bg-[#f4f8f5] px-4 py-4 sm:px-5 sm:py-5",
      )}
    >
      <div
        className="pointer-events-none absolute bottom-4 left-0 top-4 w-1 rounded-full bg-[#c8ef5a]"
        aria-hidden="true"
      />

      <div className="pl-3">
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

        <h1
          className={cn(
            exploreDisplay.className,
            DISPLAY_HERO,
            "mt-3 text-[1.625rem] sm:text-[1.875rem] lg:text-[2rem]",
          )}
        >
          Compare internships
        </h1>
        <p className={cn("mt-2 max-w-2xl text-sm leading-relaxed sm:text-[15px]", MUTED)}>
          Line up two or three verified Reality Cards to see how internships differ in
          work nature, costs, mentorship, skills, and application pathways — before you
          decide where to apply.
        </p>
      </div>
    </header>
  );
}
