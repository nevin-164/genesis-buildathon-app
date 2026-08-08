"use client";

import Link from "next/link";

import {
  BTN_GHOST,
  BTN_PRIMARY,
  DISPLAY_SECTION,
  FOCUS_RING,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { cn } from "@/lib/cn";

export default function ApplicationError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <StudentPageShell>
      <section
        className={cn(PANEL, "mx-auto max-w-lg p-6 sm:p-8")}
        aria-labelledby="application-error-heading"
      >
        <h1 id="application-error-heading" className={cn(DISPLAY_SECTION, "text-xl sm:text-2xl")}>
          Applications could not load
        </h1>
        <p className={cn("mt-2 text-sm leading-relaxed", MUTED)}>
          We could not load your internship applications right now. Please try again, or return to
          your dashboard.
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
            href="/student/application"
            className={cn(BTN_GHOST, "w-full justify-center py-2.5 sm:w-auto", FOCUS_RING, MOTION)}
          >
            My applications
          </Link>
          <Link
            href="/student"
            className={cn(BTN_GHOST, "w-full justify-center py-2.5 sm:w-auto", FOCUS_RING, MOTION)}
          >
            Student dashboard
          </Link>
        </div>
      </section>
    </StudentPageShell>
  );
}
