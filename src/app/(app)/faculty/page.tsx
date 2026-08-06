import Link from "next/link";
import { getFacultyCounts } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import { CountTile } from "@/components/faculty/CountTile";

export default async function FacultyDashboard() {
  await requireFacultyPage();
  const counts = await getFacultyCounts();

  const totalAttention = counts.pendingApplications + counts.pendingVerifications;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Good morning, Dr. Meera
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Faculty Advisor Dashboard &bull; Internship Approval &amp; Verification
        </p>
      </div>

      {/* NEEDS YOUR ATTENTION SECTION */}
      <section className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Needs Your Attention
        </h2>

        {totalAttention === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
            Nothing waiting. You&apos;re all caught up.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <CountTile
              count={counts.pendingApplications}
              label="Applications waiting for approval"
              href="/faculty/applications"
              size="attention"
              variant={counts.pendingApplications > 0 ? "amber" : "neutral"}
            />
            <CountTile
              count={counts.pendingVerifications}
              label="Experiences waiting for verification"
              href="/faculty/verifications"
              size="attention"
              variant={counts.pendingVerifications > 0 ? "blue" : "neutral"}
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
            href="/faculty/students?filter=assignedStudents"
            variant="neutral"
          />
          <CountTile
            count={counts.notSubmitted}
            label="Not submitted"
            sublabel="No plan yet"
            href="/faculty/students?filter=notSubmitted"
            variant="gray"
          />
          <CountTile
            count={counts.clarificationRequested}
            label="Clarification sent"
            sublabel="Awaiting student"
            href="/faculty/students?filter=clarificationRequested"
            variant="amber"
          />
          <CountTile
            count={counts.approved}
            label="Approved"
            sublabel="Ready to start"
            href="/faculty/students?filter=approved"
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
