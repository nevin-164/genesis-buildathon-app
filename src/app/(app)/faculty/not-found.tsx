import Link from "next/link";

export default function FacultyNotFound() {
  return (
    <div className="mx-auto max-w-xl p-8 text-center my-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Record Not Found
        </h2>
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
          This student, application, or experience record does not exist or is not assigned to your advising account.
        </p>
        <div className="mt-6">
          <Link
            href="/faculty"
            className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Return to Faculty Dashboard &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
