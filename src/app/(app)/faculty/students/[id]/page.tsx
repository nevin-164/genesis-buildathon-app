import Link from "next/link";
import { getStudentHistory } from "@/controllers/faculty.controller";
import { requireFacultyPage } from "@/lib/auth/dal";

export default async function SingleStudentPage(
  props: PageProps<"/faculty/students/[id]">
) {
  await requireFacultyPage();
  const { id } = await props.params;
  const history = await getStudentHistory(id);

  const getStatusBadge = (status: string) => {
    if (status === "not_submitted") {
      return (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
          Not submitted
        </span>
      );
    }
    if (status === "submitted" || status === "under_review") {
      return (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950 dark:text-blue-300">
          Under review
        </span>
      );
    }
    if (status === "clarification_requested" || status === "changes_requested") {
      const label =
        status === "clarification_requested" ? "Clarification needed" : "Changes requested";
      return (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {label}
        </span>
      );
    }
    if (status === "approved" || status === "verified" || status === "published") {
      const label = status === "published" || status === "verified" ? "Published" : "Approved";
      return (
        <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {label}
        </span>
      );
    }
    if (status === "rejected") {
      return (
        <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800 dark:bg-rose-950 dark:text-rose-300">
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
        {status}
      </span>
    );
  };

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
              {history.student.name}
            </h1>
            <p className="mt-1 font-mono text-sm text-slate-500 dark:text-slate-400">
              Reg. No: {history.student.registerNumber}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <div>Class: <span className="font-semibold text-slate-900 dark:text-slate-200">{history.student.className}</span></div>
            <div>Email: <span className="font-semibold text-slate-900 dark:text-slate-200">{history.student.email}</span></div>
          </div>
        </div>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Internship Applications ({history.applications?.length || 0})
        </h2>
        {!history.applications || history.applications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No internship applications submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">View Brief</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {history.applications.map((app) => (
                  <tr key={app.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {app.companyName}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {app.role}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/faculty/applications/${app.id}`}
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        View brief &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Experiences List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          Completed Experiences ({history.experiences?.length || 0})
        </h2>
        {!history.experiences || history.experiences.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
            No completed experiences recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
                <tr>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">View Screen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {history.experiences.map((exp) => (
                  <tr key={exp.id} className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {exp.companyName}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {exp.role}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(exp.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/faculty/verifications/${exp.id}`}
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Verification screen &rarr;
                      </Link>
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
