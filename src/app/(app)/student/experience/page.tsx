import Link from "next/link";

import { ContributableInternshipCard } from "@/components/experience/ContributableInternshipCard";
import { ExperienceStatusCard } from "@/components/experience/ExperienceStatusCard";
import { findOpenExperienceDraft } from "@/components/experience/experience-workflow";
import { EmptySearchIcon } from "@/components/explore/explore-icons";
import {
  BTN_GHOST,
  DISPLAY_HERO,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import {
  listContributableApplications,
  listMyExperiences,
} from "@/controllers/experience.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

export default async function ExperienceOverviewPage() {
  await requireStudentPage();

  const [experiences, contributable] = await Promise.all([
    listMyExperiences(),
    listContributableApplications(),
  ]);

  const openDraft = findOpenExperienceDraft(experiences);
  const singleExperience = experiences.length === 1;
  const hasContributable = contributable.length > 0;
  const hasExperiences = experiences.length > 0;

  return (
    <StudentPageShell>
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
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a968d]">
            My experience
          </p>
          <h1 className={cn(DISPLAY_HERO, "mt-1 text-[1.65rem] sm:text-[1.875rem]")}>
            Share what your internship was really like
          </h1>
          <p className={cn("mt-1 max-w-2xl text-[15px] leading-snug", MUTED)}>
            After faculty approves your internship, write an honest report, attach your
            certificate, and submit it for verification. Verified reports become Reality Cards
            for future students.
          </p>
        </div>
      </header>

      {!hasContributable && !hasExperiences && (
        <div
          className={cn(
            PANEL,
            "flex min-w-0 flex-col items-center border-dashed px-5 py-12 text-center",
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d8e0d6] bg-[#ecf8ee] text-[#5c6b62]">
            <EmptySearchIcon />
          </div>
          <h2 className={cn("text-sm font-semibold", INK)}>No eligible internship yet</h2>
          <p className={cn("mx-auto mt-1 max-w-md text-sm", MUTED)}>
            Once faculty approves an internship and it is complete, you can return here to
            contribute your experience report.
          </p>
          <Link
            href="/student/application"
            className={cn(BTN_GHOST, "mt-4 px-4 py-2 text-sm", MOTION, FOCUS_RING)}
          >
            View my applications
          </Link>
        </div>
      )}

      {openDraft && (
        <section className={cn(PANEL, "min-w-0 border-amber-200/80 bg-amber-50/30 p-4 sm:p-5")}>
          <p className={cn("text-sm", MUTED)}>
            You already have a report in progress. Continue it before starting another one.
          </p>
          <Link
            href={`/student/experience/${openDraft.id}/edit`}
            className={cn(BTN_GHOST, "mt-3 inline-flex px-4 py-2 text-sm", MOTION, FOCUS_RING)}
          >
            Continue draft
          </Link>
        </section>
      )}

      {hasContributable && !openDraft && (
        <div className="grid min-w-0 gap-4 sm:gap-5">
          {contributable.map((item) => (
            <ContributableInternshipCard key={item.applicationId} contributable={item} />
          ))}
        </div>
      )}

      {hasExperiences && (
        <ul
          className={cn(
            "grid w-full min-w-0 gap-4 sm:gap-5",
            singleExperience ? "grid-cols-1" : "md:grid-cols-2",
          )}
          aria-label="Your experience reports"
        >
          {experiences.map((experience) => (
            <li key={experience.id} className="flex min-w-0 w-full">
              <ExperienceStatusCard experience={experience} />
            </li>
          ))}
        </ul>
      )}
    </StudentPageShell>
  );
}
