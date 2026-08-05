import Link from "next/link";
import { ReactNode } from "react";

export interface Column<T> {
  header: string;
  cell: (item: T) => ReactNode;
}

interface OrgListProps<T> {
  title: string;
  items: T[];
  columns: Column<T>[];
  emptyMessage?: string;
}

export function OrgList<T extends { id?: string }>({
  title,
  items,
  columns,
  emptyMessage = "No items found.",
}: OrgListProps<T>) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
        <h2 className="text-lg font-bold text-white tracking-wide">{title}</h2>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
          {items.length} total
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-12 text-center text-slate-500 text-sm">
          {emptyMessage}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/60 text-xs font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-800">
              <tr>
                {columns.map((col, i) => (
                  <th key={i} className="px-6 py-3.5">
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((item, index) => (
                <tr
                  key={item.id ?? index}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  {columns.map((col, i) => (
                    <td key={i} className="px-6 py-4 font-medium">
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
