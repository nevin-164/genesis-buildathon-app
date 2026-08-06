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

/** Next.js 16 error boundaries expose `retry`, not `reset`. */
export default function ExploreError({
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
          aria-labelledby="explore-error-heading"
        >
          <h1 id="explore-error-heading" className={cn(DISPLAY_SECTION, "text-xl sm:text-2xl")}>
            Internships could not load
          </h1>
          <p className={cn("mt-2 text-sm leading-relaxed", MUTED)}>
            We could not load internship experiences right now. Please try again, or return to
            Explore or your dashboard.
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
            <Link
              href="/student"
              className={cn(BTN_GHOST, "w-full justify-center py-2.5 sm:w-auto", FOCUS_RING, MOTION)}
            >
              Student dashboard
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
