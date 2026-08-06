import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import {
  BTN_PRIMARY,
  DISPLAY_SECTION,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { cn } from "@/lib/cn";

export default function InternshipNotFound() {
  return (
    <StudentPageShell stack={false}>
      <article className="mx-auto w-full max-w-lg min-w-0">
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

        <section
          className={cn(PANEL, "relative mt-4 overflow-hidden bg-[#f4f8f5] p-6 sm:p-8")}
          aria-labelledby="experience-not-found-heading"
        >
          <div
            className="pointer-events-none absolute bottom-4 left-0 top-4 w-1 rounded-full bg-[#c8ef5a]"
            aria-hidden="true"
          />
          <div className="pl-3">
            <p className="text-xs font-medium text-[#8a968d]">Reality Card</p>
            <h1
              id="experience-not-found-heading"
              className={cn(DISPLAY_SECTION, "mt-2 text-xl sm:text-2xl")}
            >
              Internship not found
            </h1>
            <p className={cn("mt-3 text-sm leading-relaxed", MUTED)}>
              The requested internship experience could not be found. It may have been removed, or
              the link may be incorrect.
            </p>
            <Link
              href="/student/explore"
              className={cn(BTN_PRIMARY, "mt-6 inline-flex", MOTION, FOCUS_RING)}
            >
              Back to Explore
            </Link>
          </div>
        </section>
      </article>
    </StudentPageShell>
  );
}
