import type { ReactNode } from "react";

import {
  EMPTY,
  EYEBROW,
  MONO,
  MUTED,
  PANEL_FLUSH,
  PANEL_HEADER,
  TABLE,
  TABLE_HEAD,
  TABLE_WRAP,
  TBODY,
  TH,
  TR,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";

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
    <section className={PANEL_FLUSH}>
      <div className={PANEL_HEADER}>
        <h2 className={EYEBROW}>{title}</h2>
        <span className={cn(MONO, MUTED)}>
          {items.length} {items.length === 1 ? "row" : "rows"}
        </span>
      </div>

      {items.length === 0 ? (
        <p className={EMPTY}>{emptyMessage}</p>
      ) : (
        <div className={TABLE_WRAP}>
          <table className={TABLE}>
            <thead className={TABLE_HEAD}>
              <tr>
                {columns.map((col) => (
                  <th key={col.header} scope="col" className={TH}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={TBODY}>
              {items.map((item) => (
                <tr key={item.id} className={TR}>
                  {columns.map((col) => (
                    <td
                      key={col.header}
                      className={cn("px-5 py-3.5 align-middle sm:px-6", col.className)}
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
    </section>
  );
}
