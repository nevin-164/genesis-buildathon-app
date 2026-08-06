import Link from "next/link";

export interface QueueItem {
  id: string;
  studentName: string;
  registerNumber: string;
  companyName: string;
  role: string;
  waitingDays: number;
}

interface QueueTableProps {
  items: QueueItem[];
  baseLink: string; // e.g. "/faculty/applications" or "/faculty/verifications"
  heading: string;
  emptyStateText: string;
}

export function QueueTable({
  items,
  baseLink,
  heading,
  emptyStateText,
}: QueueTableProps) {
  // Sort oldest first (highest waitingDays first)
  const sortedItems = [...items].sort((a, b) => b.waitingDays - a.waitingDays);

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {heading} ({items.length})
        </h2>
      </div>

      {sortedItems.length === 0 ? (
        <div className="p-12 text-center text-slate-500 dark:text-slate-400">
          <p className="text-base font-medium">{emptyStateText}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
              <tr>
                <th className="px-6 py-3">Student</th>
                <th className="px-6 py-3">Reg. No.</th>
                <th className="px-6 py-3">Company</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Waiting</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {sortedItems.map((item) => {
                let waitingBadgeColor =
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
                if (item.waitingDays > 14) {
                  waitingBadgeColor =
                    "bg-rose-100 text-rose-800 font-bold dark:bg-rose-950 dark:text-rose-300";
                } else if (item.waitingDays > 7) {
                  waitingBadgeColor =
                    "bg-amber-100 text-amber-800 font-bold dark:bg-amber-950 dark:text-amber-300";
                }

                return (
                  <tr
                    key={item.id}
                    className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100">
                      {item.studentName}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {item.registerNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-800 dark:text-slate-200">
                      {item.companyName}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {item.role}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${waitingBadgeColor}`}
                      >
                        {item.waitingDays} {item.waitingDays === 1 ? "day" : "days"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`${baseLink}/${item.id}`}
                        className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Review &rarr;
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
