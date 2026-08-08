"use client";

import Link from "next/link";

import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  DISPLAY_SECTION,
  FOCUS_RING,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import {
  APP_CONTAINER,
  STUDENT_PAGE_CANVAS,
} from "@/components/layout/app-container";
import { cn } from "@/lib/cn";

export default function CompareError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className={cn(exploreFont.className, exploreDisplay.variable, STUDENT_PAGE_CANVAS)}>
      <div className={APP_CONTAINER}>
        <section
          className={cn(PANEL, "mx-auto max-w-lg p-6 sm:p-8")}
          aria-labelledby="compare-error-heading"
        >
          <h1 id="compare-error-heading" className={cn(DISPLAY_SECTION, "text-xl sm:text-2xl")}>
            Comparison could not load
          </h1>
          <p className={cn("mt-2 text-sm leading-relaxed", MUTED)}>
            We could not load the internship comparison right now. Please try again, or return to
            Explore.
          </p>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() => retry()}
              className={cn(BTN_PRIMARY, "w-full sm:w-auto", MOTION, FOCUS_RING)}
            >
              Try again
            </button>
            <Link
              href="/student/explore"
              className={cn(BTN_GHOST, "w-full justify-center py-2.5 sm:w-auto", FOCUS_RING, MOTION)}
            >
              Back to Explore
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
