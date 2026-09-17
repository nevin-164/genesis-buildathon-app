import Link from "next/link";

import {
  badge,
  EMPTY,
  EYEBROW,
  FAINT,
  INK,
  LINK_ACTION,
  MONO,
  MUTED,
  PANEL_FLUSH,
  PANEL_HEADER,
  TABLE,
  TABLE_HEAD,
  TABLE_WRAP,
  TBODY,
  TD,
  TH,
  TR,
  type Tone,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
import type { Role } from "@/types/contracts";

export type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  registerNumber?: string | null;
  className?: string | null;
  batchName?: string | null;
  departmentName?: string | null;
  advisorName?: string | null;
  /** Faculty only. Students are always 0. */
  advisedClassCount?: number;
  createdAt?: string | null;
};

/**
 * Role tone. The admin used to be violet and faculty blue, neither of which
 * belongs to this palette; the three are now told apart by weight instead —
 * lime for the one account that can change everything, mint for the ones that
 * verify, plain for the many.
 */
const ROLE_TONE: Record<Role, Tone> = {
  admin: "lime",
  faculty: "mint",
  student: "neutral",
};

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  faculty: "Faculty",
  student: "Student",
};

/** Fixed locale + timezone so the server-rendered string never drifts. */
const DATE_FORMAT = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : DATE_FORMAT.format(date);
}

/**
 * How many classes a faculty member advises.
 *
 * Zero is worth calling out rather than hiding: it is a registered advisor
 * nobody has given a class to, which is the admin's cue to either use them or
 * know they are idle. It is not an error — faculty register before the tree
 * exists — so it is quiet, not amber.
 */
function AdvisedCount({ count }: { count: number }) {
  if (count === 0) {
    return <span className={badge("neutral")}>No classes</span>;
  }
  return (
    <span className={INK}>
      {count} {count === 1 ? "class" : "classes"}
    </span>
  );
}

const HEADERS = [
  "User",
  "Role",
  "Status",
  "Register No.",
  "Class",
  "Batch",
  // Students: who verifies their work. Faculty: how many classes they carry.
  // Same column, because for both roles it answers "where do they sit in the
  // routing".
  "Advisor / Classes",
  "Created",
  "",
];

/** The users directory. Read-only — every mutation lives on the edit screen. */
export function UserTable({ items, total }: { items: UserRow[]; total: number }) {
  return (
    <section className={PANEL_FLUSH}>
      <div className={PANEL_HEADER}>
        <h2 className={EYEBROW}>Users directory</h2>
        <span className={cn(MONO, MUTED)}>
          showing {items.length} of {total}
        </span>
      </div>

      {items.length === 0 ? (
        <p className={EMPTY}>No users match these filters.</p>
      ) : (
        <div className={TABLE_WRAP}>
          <table className={TABLE}>
            <thead className={TABLE_HEAD}>
              <tr>
                {HEADERS.map((header, i) => (
                  <th key={header || `col-${i}`} scope="col" className={TH}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className={TBODY}>
              {items.map((user) => (
                <tr key={user.id} className={TR}>
                  <td className="px-5 py-3.5 sm:px-6">
                    <div className={cn("font-semibold", INK)}>{user.fullName}</div>
                    <div className={cn("text-xs", FAINT)}>{user.email}</div>
                  </td>

                  <td className={cn(TD, "whitespace-nowrap")}>
                    <span className={badge(ROLE_TONE[user.role])}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>

                  <td className={cn(TD, "whitespace-nowrap")}>
                    <span className={badge(user.isActive ? "mint" : "neutral")}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  <td className={cn(TD, MONO, "whitespace-nowrap")}>
                    {user.registerNumber ?? "—"}
                  </td>

                  <td className={cn(TD, INK, "whitespace-nowrap")}>{user.className ?? "—"}</td>

                  <td className={cn(TD, "whitespace-nowrap")}>
                    {user.batchName ? (
                      <>
                        {user.departmentName ? (
                          <span className={FAINT}>{user.departmentName} </span>
                        ) : null}
                        {user.batchName}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className={cn(TD, "whitespace-nowrap")}>
                    {user.role === "faculty" ? (
                      <AdvisedCount count={user.advisedClassCount ?? 0} />
                    ) : user.advisorName ? (
                      <span className={INK}>{user.advisorName}</span>
                    ) : (
                      <span className={FAINT}>—</span>
                    )}
                  </td>

                  <td className={cn(TD, MONO, FAINT, "whitespace-nowrap")}>
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="whitespace-nowrap px-5 py-3.5 text-right sm:px-6">
                    <Link href={`/admin/users/${user.id}`} className={LINK_ACTION}>
                      Edit <span aria-hidden="true">&rarr;</span>
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
