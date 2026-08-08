"use client";

import Link from "next/link";

import { StudentPageShell } from "@/components/layout/student-page-shell";
import {
  BTN_PRIMARY,
  BTN_SECONDARY,
  EXPLORE_PAGE,
  FOCUS_RING,
  MOTION,
  MUTED,
} from "@/components/student/student-ui";
import { CanvasPageHeader } from "@/components/student/primitives";
import { cn } from "@/lib/cn";

export default function ApplicationError({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <StudentPageShell>
      <div className={EXPLORE_PAGE}>
        <CanvasPageHeader
          eyebrow="My internships"
          title="Applications could not load"
          lead="We could not load your internship applications right now. Please try again, or return to your dashboard."
        />

        <div className="max-w-lg">
          <p className={cn("text-sm leading-relaxed", MUTED)}>
            This is usually temporary. If the problem continues, check your connection or contact
            support.
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
              className={cn(
                BTN_SECONDARY,
                "w-full justify-center px-5 sm:w-auto",
                FOCUS_RING,
                MOTION,
              )}
            >
              My applications
            </Link>
            <Link
              href="/student"
              className={cn(
                BTN_SECONDARY,
                "w-full justify-center px-5 sm:w-auto",
                FOCUS_RING,
                MOTION,
              )}
            >
              Student dashboard
            </Link>
          </div>
        </div>
      </div>
    </StudentPageShell>
  );
}
