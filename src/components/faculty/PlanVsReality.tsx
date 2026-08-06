interface PlanVsRealityRow {
  label: string;
  approved: string;
  actual: string;
}

interface PlanVsRealityProps {
  rows: PlanVsRealityRow[];
}

export function PlanVsReality({ rows }: PlanVsRealityProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-800/50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Plan vs Reality
        </h3>
      </div>
      <table className="w-full text-left text-xs sm:text-sm">
        <thead>
          <tr className="border-b border-slate-100 bg-slate-50/50 text-slate-500 dark:border-slate-800 dark:bg-slate-800/20 dark:text-slate-400">
            <th className="px-4 py-2 font-medium">Item</th>
            <th className="px-4 py-2 font-medium">Approved Plan</th>
            <th className="px-4 py-2 font-medium">Actual Experience</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {rows.map((row, index) => {
            const isDifferent =
              row.approved.trim().toLowerCase() !== row.actual.trim().toLowerCase();
            return (
              <tr
                key={index}
                className={
                  isDifferent
                    ? "bg-amber-50/80 text-amber-950 dark:bg-amber-950/30 dark:text-amber-200 font-medium"
                    : "text-slate-700 dark:text-slate-300"
                }
              >
                <td className="px-4 py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                  {row.label}
                </td>
                <td className="px-4 py-2.5">{row.approved || "—"}</td>
                <td className="px-4 py-2.5 flex items-center gap-1.5">
                  <span>{row.actual || "—"}</span>
                  {isDifferent && (
                    <span className="rounded bg-amber-200/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Changed
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
