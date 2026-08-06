import Link from "next/link";

import type { Role } from "@/types/contracts";

export type UserRow = {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  isActive: boolean;
  registerNumber?: string | null;
  className?: string | null;
  advisorName?: string | null;
  createdAt?: string | null;
};

const ROLE_STYLES: Record<Role, string> = {
  admin: "bg-purple-950/70 border-purple-800/70 text-purple-300",
  faculty: "bg-blue-950/70 border-blue-800/70 text-blue-300",
  student: "bg-slate-800 border-slate-700 text-slate-300",
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

/** The users directory. Read-only — every mutation lives on the edit screen. */
export function UserTable({ items, total }: { items: UserRow[]; total: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Users Directory
        </h2>
        <span className="text-xs font-mono text-slate-500">
          showing {items.length} of {total}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-slate-500">
          No users match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40">
                {[
                  "User",
                  "Role",
                  "Status",
                  "Register No.",
                  "Class",
                  "Advisor",
                  "Created",
                  "",
                ].map((header, i) => (
                  <th
                    key={header || `col-${i}`}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {items.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-6 py-3.5">
                    <div className="font-medium text-white">{user.fullName}</div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </td>

                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span
                      className={`px-2 py-0.5 text-xs font-semibold rounded border ${ROLE_STYLES[user.role]}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>

                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {user.isActive ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-emerald-950/70 border border-emerald-800/70 text-emerald-300">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-800 border border-slate-700 text-slate-400">
                        Inactive
                      </span>
                    )}
                  </td>

                  <td className="px-6 py-3.5 font-mono text-xs text-slate-400 whitespace-nowrap">
                    {user.registerNumber ?? "—"}
                  </td>

                  <td className="px-6 py-3.5 text-slate-300 whitespace-nowrap">
                    {user.className ?? "—"}
                  </td>

                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {user.advisorName ? (
                      <span className="text-slate-300">{user.advisorName}</span>
                    ) : user.role === "student" ? (
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-amber-950/80 border border-amber-800/80 text-amber-300">
                        No advisor
                      </span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>

                  <td className="px-6 py-3.5 font-mono text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(user.createdAt)}
                  </td>

                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
