import type { ReactNode } from "react";

/**
 * One column of an OrgList. `cell` returns JSX, so this only ever renders on
 * the server — never add "use client" to this file.
 */
export type Column<T> = {
  header: string;
  cell: (item: T) => ReactNode;
  /** Extra classes for the cells of this column. */
  className?: string;
};

/**
 * The table every org-tree screen (departments, batches, classes) renders.
 * Generic over the row type so each page keeps its own shape.
 */
export function OrgList<T extends { id: string }>({
  title,
  items,
  columns,
  emptyMessage = "Nothing here yet.",
}: {
  title: string;
  items: T[];
  columns: Column<T>[];
  emptyMessage?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-xs font-mono text-slate-500">
          {items.length} {items.length === 1 ? "row" : "rows"}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40">
                {columns.map((col) => (
                  <th
                    key={col.header}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={`px-6 py-3.5 align-middle ${col.className ?? ""}`}
                    >
                      {col.cell(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
