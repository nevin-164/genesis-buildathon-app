import Link from "next/link";

import { ApplicationCard } from "@/components/application/ApplicationCard";
import { EmptyState } from "@/components/ui";
import { listMyApplications } from "@/controllers/application.controller";
import { requireStudentPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";

const FOCUS_LINK = cn(
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2",
);

export default async function MyApplicationsPage() {
  await requireStudentPage();

  const applications = await listMyApplications();

  return (
    <div className="mx-auto w-full max-w-5xl min-w-0 space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            My applications
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create, submit and track your internship applications.
          </p>
        </div>
        <Link
          href="/student/application/new"
          className={cn(
            "inline-flex shrink-0 items-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white",
            "hover:bg-zinc-700",
            FOCUS_LINK,
          )}
        >
          New application
        </Link>
      </header>

      {applications.length === 0 ? (
        <EmptyState
          title="No internship applications yet"
          description="Create an application when you are ready to request faculty approval for an internship."
          action={
            <Link
              href="/student/application/new"
              className={cn(
                "inline-flex items-center rounded-md border border-zinc-300 bg-white px-4 py-2",
                "text-sm font-medium text-zinc-900 hover:bg-zinc-50",
                FOCUS_LINK,
              )}
            >
              Start an application
            </Link>
          }
        />
      ) : (
        <ul
          className="grid grid-cols-1 gap-4 md:grid-cols-2"
          aria-label="Your internship applications"
        >
          {applications.map((application) => (
            <li key={application.id} className="flex min-w-0">
              <ApplicationCard application={application} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
