import Link from "next/link";

import {
  EMPTY,
  FAINT,
  INK,
  LINK_ACTION,
  MONO,
  MUTED,
  PANEL_FLUSH,
  PANEL_HEADER,
  SECTION_TITLE,
  TABLE,
  TABLE_HEAD,
  TABLE_WRAP,
  TBODY,
  TD,
  TH,
  TR,
  badge,
  type Tone,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
import type { QueueItem } from "@/types/contracts";

interface QueueTableProps {
  items: QueueItem[];
  baseLink: string; // e.g. "/faculty/applications" or "/faculty/verifications"
  heading: string;
  emptyStateText: string;
}

/**
 * How long something has been waiting, escalating with age.
 *
 * Under a week is not news, so it stays quiet; a fortnight is the reviewer's
 * problem and says so in rose.
 */
function waitingTone(days: number): Tone {
  if (days > 14) return "rose";
  if (days > 7) return "amber";
  return "neutral";
}

export function QueueTable({ items, baseLink, heading, emptyStateText }: QueueTableProps) {
  // Sort oldest first (highest waitingDays first)
  const sortedItems = [...items].sort((a, b) => b.waitingDays - a.waitingDays);

  return (
    <section className={PANEL_FLUSH}>
      <div className={PANEL_HEADER}>
        <h2 className={SECTION_TITLE}>{heading}</h2>
        <span className={cn(MONO, MUTED)}>{items.length}</span>
      </div>

      {sortedItems.length === 0 ? (
        <p className={EMPTY}>{emptyStateText}</p>
      ) : (
        <div className={TABLE_WRAP}>
          <table className={TABLE}>
            <thead className={TABLE_HEAD}>
              <tr>
                <th className={TH}>Student</th>
                <th className={TH}>Reg. no.</th>
                <th className={TH}>Company</th>
                <th className={TH}>Role</th>
                <th className={TH}>Waiting</th>
                <th className={cn(TH, "text-right")}>Action</th>
              </tr>
            </thead>

            <tbody className={TBODY}>
              {sortedItems.map((item) => (
                <tr key={item.id} className={TR}>
                  <td className="px-5 py-3.5 sm:px-6">
                    <span className={cn("font-semibold", INK)}>{item.studentName}</span>
                  </td>

                  <td className={cn(TD, MONO, FAINT, "whitespace-nowrap")}>
                    {item.registerNumber}
                  </td>

                  <td className={cn(TD, INK)}>{item.companyName}</td>

                  <td className={TD}>{item.roleTitle}</td>

                  <td className={cn(TD, "whitespace-nowrap")}>
                    <span className={badge(waitingTone(item.waitingDays))}>
                      {item.waitingDays} {item.waitingDays === 1 ? "day" : "days"}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-5 py-3.5 text-right sm:px-6">
                    <Link href={`${baseLink}/${item.id}`} className={LINK_ACTION}>
                      Review <span aria-hidden="true">&rarr;</span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
