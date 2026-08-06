import Link from "next/link";
import { getFacultyCounts } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { CountTile } from "@/components/faculty/CountTile";

export default async function FacultyDashboard() {
  await requireFacultyPage();
  const counts = await getFacultyCounts();

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Faculty dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Your students, and the internships waiting on your decision.
        </p>
      </div>

      {/* NEEDS YOUR ATTENTION SECTION */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Needs Your Attention
        </h2>

        {counts.pendingVerifications === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            Nothing waiting. You&apos;re all caught up.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CountTile
              count={counts.pendingVerifications}
              label="Internships waiting for verification"
              href="/faculty/verifications"
              size="attention"
              variant="blue"
            />
          </div>
        )}
      </section>

      {/* YOUR STUDENTS SECTION */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Your Students
          </h2>
          <Link
            href="/faculty/students"
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            View all students &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          <CountTile
            count={counts.assignedStudents}
            label="Assigned"
            sublabel="Total students"
            href="/faculty/students"
            variant="neutral"
          />
          <CountTile
            count={counts.notSubmitted}
            label="Not submitted"
            sublabel="Nothing added yet"
            href="/faculty/students?filter=not_submitted"
            variant="gray"
          />
          <CountTile
            count={counts.changesRequested}
            label="Changes requested"
            sublabel="Awaiting student"
            href="/faculty/students?filter=changes_requested"
            variant="amber"
          />
          <CountTile
            count={counts.verified}
            label="Verified"
            sublabel="Published on Explore"
            href="/faculty/students?filter=verified"
            variant="green"
          />
          <CountTile
            count={counts.rejected}
            label="Rejected"
            sublabel="Terminal state"
            href="/faculty/students?filter=rejected"
            variant="red"
          />
        </div>
      </section>
    </div>
  );
}
