import Link from "next/link";

import { ApplicationCard } from "@/components/application/ApplicationCard";
import { findOpenApplicationDraft } from "@/components/application/application-workflow";
import { EmptySearchIcon } from "@/components/explore/explore-icons";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  DISPLAY_HERO,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { StudentPageShell } from "@/components/layout/student-page-shell";
import { listMyApplications } from "@/controllers/application.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

export default async function MyApplicationsPage() {
  await requireStudentPage();

  const applications = await listMyApplications();
  const singleApplication = applications.length === 1;
  const openDraft = findOpenApplicationDraft(applications);

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
        <div className="flex flex-col gap-4 pl-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8a968d]">
              My internships
            </p>
            <h1 className={cn(DISPLAY_HERO, "mt-1 text-[1.65rem] sm:text-[1.875rem]")}>
              Manage your applications
            </h1>
            <p className={cn("mt-1 max-w-xl text-[15px] leading-snug", MUTED)}>
              Track faculty approval and see what needs your attention.
            </p>
          </div>
          <Link
            href={openDraft ? `/student/application/${openDraft.id}/edit` : "/student/application/new"}
            className={cn(BTN_PRIMARY, "w-full shrink-0 sm:w-auto", MOTION, FOCUS_RING)}
          >
            {openDraft ? "Continue application" : "New application"}
          </Link>
        </div>
      </header>

      {openDraft && (
        <section className={cn(PANEL, "min-w-0 border-amber-200/80 bg-amber-50/30 p-4 sm:p-5")}>
          <p className={cn("text-sm", MUTED)}>
            You already have an application in progress. Continue it before starting another one.
          </p>
          <Link
            href={`/student/application/${openDraft.id}/edit`}
            className={cn(BTN_GHOST, "mt-3 inline-flex px-4 py-2 text-sm", MOTION, FOCUS_RING)}
          >
            Continue application
          </Link>
        </section>
      )}

      {applications.length === 0 ? (
        <div
          className={cn(
            PANEL,
            "flex min-w-0 flex-col items-center border-dashed px-5 py-12 text-center",
          )}
        >
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-[#d8e0d6] bg-[#ecf8ee] text-[#5c6b62]">
            <EmptySearchIcon />
          </div>
          <h2 className={cn("text-sm font-semibold", INK)}>No internship applications yet</h2>
          <p className={cn("mx-auto mt-1 max-w-md text-sm", MUTED)}>
            Create an application when you are ready to request faculty approval for an
            internship.
          </p>
          <Link
            href="/student/application/new"
            className={cn(BTN_GHOST, "mt-4 px-4 py-2 text-sm", MOTION, FOCUS_RING)}
          >
            Start an application
          </Link>
        </div>
      ) : (
        <ul
          className={cn(
            "grid w-full min-w-0 gap-4 sm:gap-5",
            singleApplication ? "grid-cols-1" : "md:grid-cols-2",
          )}
          aria-label="Your internship applications"
        >
          {applications.map((application) => (
            <li key={application.id} className="flex min-w-0 w-full">
              <ApplicationCard application={application} />
            </li>
          ))}
        </ul>
      )}
    </StudentPageShell>
  );
}
