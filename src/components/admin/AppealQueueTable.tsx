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
import type { AppealQueueItem } from "@/types/contracts";

/**
 * Appeals waiting on an administrator.
 *
 * A separate component from `QueueTable`, not a widened one: this queue answers
 * a different question. A verification queue asks "what has nobody looked at?";
 * this one asks "whose decision is being contested, and how long has the
 * student been waiting for an answer about it?". Hence the advisor column,
 * which has no equivalent on the faculty side.
 */

/**
 * How long the appeal has been waiting, escalating with age.
 *
 * Tighter than the verification queue's thresholds on purpose. A student whose
 * appeal sits unanswered has already been told no once; a fortnight of silence
 * on top of that is not a backlog, it is an answer by attrition.
 */
function waitingTone(days: number): Tone {
  if (days > 7) return "rose";
  if (days > 3) return "amber";
  return "neutral";
}

export function AppealQueueTable({ items }: { items: AppealQueueItem[] }) {
  return (
    <section className={PANEL_FLUSH}>
      <div className={PANEL_HEADER}>
        <h2 className={SECTION_TITLE}>Appeals waiting on you</h2>
        <span className={cn(MONO, MUTED)}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <p className={EMPTY}>
          No appeals. Students only reach this queue after an advisor has rejected
          their internship and they have contested it.
        </p>
      ) : (
        <div className={TABLE_WRAP}>
          <table className={TABLE}>
            <thead className={TABLE_HEAD}>
              <tr>
                <th className={TH}>Student</th>
                <th className={TH}>Reg. no.</th>
                <th className={TH}>Company</th>
                <th className={TH}>Rejected by</th>
                <th className={TH}>Documents</th>
                <th className={TH}>Waiting</th>
                <th className={cn(TH, "text-right")}>Action</th>
              </tr>
            </thead>

            <tbody className={TBODY}>
              {/* Already oldest-first from the model. A queue that reorders
                  itself is one people skim instead of work through. */}
              {items.map((item) => (
                <tr key={item.id} className={TR}>
                  <td className="px-5 py-3.5 sm:px-6">
                    <span className={cn("font-semibold", INK)}>{item.studentName}</span>
                    <span className={cn("mt-0.5 block text-xs", FAINT)}>{item.roleTitle}</span>
                  </td>

                  <td className={cn(TD, MONO, FAINT, "whitespace-nowrap")}>
                    {item.registerNumber}
                  </td>

                  <td className={cn(TD, INK)}>{item.companyName}</td>

                  <td className={TD}>{item.facultyName ?? "—"}</td>

                  <td className={cn(TD, "whitespace-nowrap")}>
                    {/* An appeal with nothing attached is the first thing worth
                        knowing — it usually means the same answer again. */}
                    <span className={badge(item.documentCount === 0 ? "amber" : "neutral")}>
                      {item.documentCount}
                    </span>
                  </td>

                  <td className={cn(TD, "whitespace-nowrap")}>
                    <span className={badge(waitingTone(item.waitingDays))}>
                      {item.waitingDays} {item.waitingDays === 1 ? "day" : "days"}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap sm:px-6">
                    <Link href={`/admin/appeals/${item.id}`} className={LINK_ACTION}>
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
