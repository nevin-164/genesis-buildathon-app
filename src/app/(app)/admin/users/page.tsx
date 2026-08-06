import { requireAdminPage } from "@/lib/auth/dal";
import { listUsers } from "@/controllers/admin/user.controller";
import { UserTable } from "@/components/admin/UserTable";
import { UserFilterBar } from "@/components/admin/UserFilterBar";
import Link from "next/link";

export default async function UsersPage(props: PageProps<"/admin/users">) {
  await requireAdminPage();

  const sp = await props.searchParams;
  const q = sp?.q as string | undefined;
  const role = sp?.role as "student" | "faculty" | "admin" | undefined;
  const isActiveStr = sp?.isActive as string | undefined;
  const pageStr = sp?.page as string | undefined;

  const isActive =
    isActiveStr === "true" ? true : isActiveStr === "false" ? false : undefined;
  const page = pageStr ? Math.max(1, parseInt(pageStr, 10)) : 1;

  // The page size is the backend's, not a guess — it decides how many page
  // links there are, and a wrong one renders links to empty pages.
  const { items, total, pageSize } = await listUsers({ q, role, isActive, page });

  const totalPages = Math.ceil(total / pageSize) || 1;

  return (
    <div className="space-y-6 p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Users ({total})
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage user accounts, faculty advisors, and student enrollments.
          </p>
        </div>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors shadow-sm cursor-pointer"
        >
          + New user
        </Link>
      </div>

      {/* Filter Bar (Search name/email, Role, Status) */}
      <UserFilterBar />

      {/* Users Directory Table */}
      <UserTable items={items} total={total} />

      {/* Pagination Controls ([ 1 ] 2 3 ... >) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
            const isCurrent = p === page;
            const params = new URLSearchParams();
            if (q) params.set("q", q);
            if (role) params.set("role", role);
            if (isActiveStr) params.set("isActive", isActiveStr);
            params.set("page", p.toString());

            return (
              <Link
                key={p}
                href={`/admin/users?${params.toString()}`}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  isCurrent
                    ? "bg-blue-600 text-white"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
