import Link from "next/link";

import { UserFilterBar } from "@/components/admin/UserFilterBar";
import { UserTable } from "@/components/admin/UserTable";
import { StaffContent, StaffPageHeader } from "@/components/staff/StaffShell";
import { BTN_SECONDARY_SM, FOCUS, MOTION } from "@/components/staff/staff-ui";
import { listUsers } from "@/controllers/admin/user.controller";
import { getOrgTree } from "@/controllers/auth.controller";
import { requireAdminPage } from "@/lib/auth/dal";
import { cn } from "@/lib/cn";
import type { Role } from "@/types/contracts";

/**
 * The users directory.
 *
 * There is no "new user" button. Students and faculty both register themselves;
 * an admin creating an account would mean inventing a password and delivering
 * it out of band. What an admin does here is find people and correct them.
 */
export default async function UsersPage(props: PageProps<"/admin/users">) {
  await requireAdminPage();

  const sp = await props.searchParams;
  const one = (key: string) => (typeof sp?.[key] === "string" ? (sp[key] as string) : undefined);

  const q = one("q");
  const role = one("role") as Role | undefined;
  const isActiveStr = one("isActive");
  const departmentId = one("departmentId");
  const batchId = one("batchId");
  const classId = one("classId");

  const isActive = isActiveStr === "true" ? true : isActiveStr === "false" ? false : undefined;
  const page = Math.max(1, Number.parseInt(one("page") ?? "1", 10) || 1);

  // The page size is the backend's, not a guess — it decides how many page
  // links there are, and a wrong one renders links to empty pages.
  const [{ items, total, pageSize }, tree] = await Promise.all([
    listUsers({ q, role, isActive, departmentId, batchId, classId, page }),
    // Ids and names only. The same tree the registration cascade reads.
    getOrgTree(),
  ]);

  const totalPages = Math.ceil(total / pageSize) || 1;

  /** Carry every active filter across a page link. */
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({
      q,
      role,
      isActive: isActiveStr,
      departmentId,
      batchId,
      classId,
    })) {
      if (value) params.set(key, value);
    }
    params.set("page", String(target));
    return `/admin/users?${params.toString()}`;
  };

  return (
    <StaffContent>
      <StaffPageHeader
        eyebrow="Admin console"
        title={`Users (${total})`}
        subtitle="Everyone who has registered."
      />

      <UserFilterBar tree={tree} />

      <UserTable items={items} total={total} />

      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-1.5 pt-2" aria-label="Pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={pageHref(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "min-w-9 rounded-lg px-3 py-1.5 text-center text-xs font-bold tabular-nums",
                MOTION,
                FOCUS,
                p === page
                  ? "bg-[#c8ef5a] text-[#0b120e]"
                  : BTN_SECONDARY_SM,
              )}
            >
              {p}
            </Link>
          ))}
        </nav>
      )}
    </StaffContent>
  );
}
