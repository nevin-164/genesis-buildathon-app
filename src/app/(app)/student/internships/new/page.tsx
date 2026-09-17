import Link from "next/link";

import { ChevronRightIcon } from "@/components/explore/explore-icons";
import {
  DISPLAY_HERO,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { InternshipForm } from "@/components/internship/InternshipForm";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

import { createInternshipAction } from "../actions";

/**
 * Adding an internship — after it has finished, not before.
 *
 * Nobody approves this in advance. The student writes down what actually
 * happened, attaches what backs it up, and their advisor checks the two
 * against each other.
 *
 * Documents cannot be attached here, because a file has to point at a row that
 * exists. Saving a draft creates that row and moves the student to the edit
 * screen, which is where the documents panel lives.
 */
export default async function NewInternshipPage() {
  await requireStudentPage();

  return (
    <StudentPageShell>
      <Link
        href="/student/internships"
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium",
          INK,
          "hover:text-[#2d5038] hover:underline",
          MOTION,
          FOCUS_RING,
        )}
      >
        <ChevronRightIcon className="rotate-180" aria-hidden="true" />
        Back to my internships
      </Link>

      <header className={cn(PANEL, "relative overflow-hidden bg-[#f4f8f5] px-4 py-4 sm:px-5 sm:py-5")}>
        <div
          className="pointer-events-none absolute top-4 bottom-4 left-0 w-1 rounded-full bg-[#c8ef5a]"
          aria-hidden="true"
        />
        <div className="pl-3">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-[#8a968d] uppercase">
            New internship
          </p>
          <h1 className={cn(DISPLAY_HERO, "mt-1")}>
            What actually happened
          </h1>
          <p className={cn("mt-1 max-w-2xl text-[15px] leading-snug", MUTED)}>
            Write it the way you wish somebody had written it for you. The money, the
            work, the mentorship — the parts an advertisement leaves out. Nothing here
            is visible to anyone until your advisor verifies it.
          </p>
        </div>
      </header>

      <InternshipForm
        action={createInternshipAction}
        saveLabel="Save draft and attach documents"
      />
    </StudentPageShell>
  );
}
