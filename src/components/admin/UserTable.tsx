import Link from "next/link";

export interface AdminUserRow {
  id: string;
  fullName: string;
  email: string;
  role: "student" | "faculty" | "admin";
  isActive: boolean;
  className?: string | null;
  advisorName?: string | null;
  registerNumber?: string | null;
}

interface UserTableProps {
  items: AdminUserRow[];
  total: number;
}

export function UserTable({ items }: UserTableProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-slate-950/60 text-xs font-semibold uppercase text-slate-400 tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Name</th>
              <th className="px-6 py-3.5">Email</th>
              <th className="px-6 py-3.5">Role</th>
              <th className="px-6 py-3.5">Class</th>
              <th className="px-6 py-3.5">Advisor</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                  No users found matching the search criteria.
                </td>
              </tr>
            ) : (
              items.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-2">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="hover:text-blue-400 transition-colors"
                    >
                      {user.fullName}
                    </Link>
                    {!user.isActive && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 capitalize text-xs">
                    <span
                      className={`px-2.5 py-1 rounded-full font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-950 text-purple-300 border border-purple-800"
                          : user.role === "faculty"
                          ? "bg-blue-950 text-blue-300 border border-blue-800"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-xs">
                    {user.role === "student" ? user.className ?? "—" : "—"}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {user.role === "student" ? (
                      user.advisorName ? (
                        <span className="text-slate-300">{user.advisorName}</span>
                      ) : (
                        <span className="text-slate-500 font-italic">(none)</span>
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-xs font-semibold text-blue-400 hover:text-blue-300 underline"
                    >
                      Edit →
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
