import Link from "next/link";
import { getStudentHistory } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";
import type { InternshipStatus } from "@/types/contracts";

const STATUS_BADGE: Record<InternshipStatus, { label: string; className: string }> = {
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  },
  submitted: {
    label: "Under review",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  },
  changes_requested: {
    label: "Changes requested",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  },
  verified: {
    label: "Published",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
  },
};

function StatusBadge({ status }: { status: InternshipStatus }) {
  const badge = STATUS_BADGE[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.className}`}
    >
      {badge.label}
    </span>
  );
}

export default async function SingleStudentPage(
  props: PageProps<"/faculty/students/[id]">
) {
  await requireFacultyPage();
  const { id } = await props.params;
  const history = await getStudentHistory(id);

  const { student, internships } = history;

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6 sm:p-8">
      {/* Back link */}
      <div>
        <Link
          href="/faculty/students"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          &larr; Back to assigned students
        </Link>
      </div>

      {/* Student Profile Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {student.fullName}
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-500 dark:text-slate-400">
              Reg. No: {student.registerNumber}
            </p>
          </div>
          <div className="space-y-1 text-left text-xs text-slate-600 sm:text-right dark:text-slate-400">
            <div>
              Class:{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {student.className ?? "Not enrolled"}
              </span>
            </div>
            <div>
              Email:{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                {student.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Internships */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Internships ({internships.length})
        </h2>

        {internships.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            Nothing added yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {internships.map((internship) => (
                  <tr
                    key={internship.id}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {internship.companyName}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {internship.roleTitle}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={internship.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {/* A draft is not visible to the advisor yet, so there is
                          nothing to open. */}
                      {internship.status === "draft" ? (
                        <span className="text-xs text-slate-400 dark:text-slate-600">—</span>
                      ) : (
                        <Link
                          href={`/faculty/verifications/${internship.id}`}
                          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Open &rarr;
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
