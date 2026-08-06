import Link from "next/link";

import { requireAdminPage } from "@/lib/auth/dal";
import { getAdminCounts } from "@/controllers/admin/user.controller";

type Stat = {
  label: string;
  value: number;
  hint: string;
  href: string;
  /** Highlights a count that means somebody is blocked. */
  warn?: boolean;
};

export default async function AdminDashboardPage() {
  await requireAdminPage();

  const counts = await getAdminCounts();

  const stats: Stat[] = [
    {
      label: "Students",
      value: counts.totalStudents,
      hint: "Active student accounts",
      href: "/admin/users?role=student",
    },
    {
      label: "Faculty",
      value: counts.totalFaculty,
      hint: "Accounts that can verify",
      href: "/admin/users?role=faculty",
    },
    {
      label: "Unassigned internships",
      value: counts.unassignedInternships,
      hint: "Submitted with nobody to verify them",
      href: "/admin/assignments",
      warn: counts.unassignedInternships > 0,
    },
    {
      label: "Classes without an advisor",
      value: counts.classesWithoutAdvisor,
      hint: "Every student in them lands unassigned",
      href: "/admin/classes",
      warn: counts.classesWithoutAdvisor > 0,
    },
    {
      label: "Pending verifications",
      value: counts.pendingVerifications,
      hint: "Waiting on a faculty decision",
      href: "/admin/assignments",
    },
    {
      label: "Published internships",
      value: counts.publishedInternships,
      hint: "Verified and visible on Explore",
      href: "/admin/users",
    },
  ];

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">
          Admin dashboard
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          The organisation tree, the accounts in it, and anything currently
          stuck.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className={`block rounded-xl border p-5 shadow-sm transition-colors ${
              stat.warn
                ? "bg-amber-950/30 border-amber-800/60 hover:border-amber-600"
                : "bg-slate-900 border-slate-800 hover:border-slate-600"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
            <p
              className={`mt-2 text-3xl font-bold tabular-nums ${
                stat.warn ? "text-amber-300" : "text-white"
              }`}
            >
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{stat.hint}</p>
          </Link>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Set-up order
        </h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed">
          Departments hold batches, batches hold classes, and the class carries
          the faculty advisor. Build the tree top-down before creating student
          accounts — a student with no class has no advisor, and their
          internship arrives with nobody assigned to it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { href: "/admin/departments", label: "1 · Departments" },
            { href: "/admin/batches", label: "2 · Batches" },
            { href: "/admin/classes", label: "3 · Classes + advisors" },
            { href: "/admin/users/new", label: "4 · Create accounts" },
            { href: "/admin/assignments", label: "Repair · Assignments" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-950 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
