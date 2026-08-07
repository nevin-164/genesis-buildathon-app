import Link from "next/link";

import { ApplicationCard } from "@/components/application/ApplicationCard";
import { EmptySearchIcon } from "@/components/explore/explore-icons";
import { exploreDisplay, exploreFont } from "@/components/explore/explore-font";
import {
  BTN_GHOST,
  BTN_PRIMARY,
  DISPLAY_HERO,
  EXPLORE_PAGE,
  EXPLORE_ROOT,
  FOCUS_RING,
  INK,
  MOTION,
  MUTED,
  PANEL,
} from "@/components/explore/explore-ui";
import { listMyInternships } from "@/controllers/internship.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

export default async function MyApplicationsPage() {
  await requireStudentPage();

  const applications = await listMyInternships();
  const singleApplication = applications.length === 1;

  return (
    <div className={cn(exploreFont.className, exploreDisplay.variable, EXPLORE_ROOT)}>
      <div className={cn(EXPLORE_PAGE, "mx-auto w-full max-w-5xl min-w-0")}>
        <header
          className={cn(
            PANEL,
            "relative overflow-hidden bg-[#f4f8f5] px-4 py-4 sm:px-5 sm:py-5",
          )}
        >
          <div
            className="pointer-events-none absolute bottom-4 left-0 top-4 w-1 rounded-full bg-[#c8ef5a]"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-4 pl-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#8a968d]">
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
              href="/student/application/new"
              className={cn(BTN_PRIMARY, "w-full shrink-0 sm:w-auto", MOTION, FOCUS_RING)}
            >
              New application
            </Link>
          </div>
        </header>

        {applications.length === 0 ? (
          <div
            className={cn(
              PANEL,
              "flex flex-col items-center border-dashed px-5 py-12 text-center",
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
              "grid gap-4",
              singleApplication ? "grid-cols-1" : "md:grid-cols-2",
            )}
            aria-label="Your internship applications"
          >
            {applications.map((application) => (
              <li
                key={application.id}
                className={cn("flex min-w-0", singleApplication && "col-span-full")}
              >
                <ApplicationCard application={application} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

