"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import {
  BTN_PRIMARY_SM,
  BTN_SECONDARY_SM,
  CONTROL_SM,
  CONTROL_SM_SELECT,
  DIVIDER,
  FAINT,
  LABEL,
  PANEL,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";
import type { OrgTree } from "@/types/contracts";

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Administrator" },
];

const STATUS_OPTIONS = [
  { value: "true", label: "Active" },
  { value: "false", label: "Inactive" },
];

/**
 * Search, role, status and the department → batch → class cascade.
 *
 * Everything is held in the query string, so /admin/users?classId=… is a
 * shareable view and the page itself stays a Server Component.
 */
export function UserFilterBar({ tree }: { tree: OrgTree }) {
  return (
    <Suspense fallback={<div className={cn(PANEL, "h-[190px]")} />}>
      <UserFilterBarInner tree={tree} />
    </Suspense>
  );
}

function UserFilterBarInner({ tree }: { tree: OrgTree }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? "";
  const isActive = searchParams.get("isActive") ?? "";
  const departmentId = searchParams.get("departmentId") ?? "";
  const batchId = searchParams.get("batchId") ?? "";
  const classId = searchParams.get("classId") ?? "";

  const hasFilters = Boolean(q || role || isActive || departmentId || batchId || classId);

  // Faculty and admin rows reach `student_profiles` through nothing at all, so
  // an org filter would always return an empty page. Disable rather than hide,
  // so the controls do not jump around as the role changes.
  const orgDisabled = role === "faculty" || role === "admin";

  const batches = useMemo(
    () => tree.batches.filter((batch) => !departmentId || batch.departmentId === departmentId),
    [tree.batches, departmentId],
  );
  const classes = useMemo(
    () =>
      tree.classes.filter((cls) => {
        if (batchId) return cls.batchId === batchId;
        if (departmentId) return batches.some((batch) => batch.id === cls.batchId);
        return true;
      }),
    [tree.classes, batches, batchId, departmentId],
  );

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    // A changed filter invalidates the current page number.
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const value = new FormData(event.currentTarget).get("q");
        apply({ q: typeof value === "string" ? value.trim() : "" });
      }}
      className={cn(PANEL, "space-y-4 p-4")}
    >
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-[2]">
          <label htmlFor="q" className={LABEL}>
            Search name, email or register number
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            key={q}
            placeholder="e.g. anjali or CS22001"
            className={CONTROL_SM}
          />
        </div>

        <div className="min-w-[150px] flex-1">
          <label htmlFor="role" className={LABEL}>
            Role
          </label>
          <select
            id="role"
            value={role}
            onChange={(event) =>
              // Leaving the student view strands any org filter on an empty
              // result set, so clear all three with it.
              apply(
                event.target.value === "student" || event.target.value === ""
                  ? { role: event.target.value }
                  : { role: event.target.value, departmentId: "", batchId: "", classId: "" },
              )
            }
            className={CONTROL_SM_SELECT}
          >
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[150px] flex-1">
          <label htmlFor="isActive" className={LABEL}>
            Status
          </label>
          <select
            id="isActive"
            value={isActive}
            onChange={(event) => apply({ isActive: event.target.value })}
            className={CONTROL_SM_SELECT}
          >
            <option value="">Any status</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className={BTN_PRIMARY_SM}>
          Search
        </button>

        {hasFilters && (
          <button type="button" onClick={() => router.push(pathname)} className={BTN_SECONDARY_SM}>
            Clear
          </button>
        )}
      </div>

      <div className={cn("flex flex-wrap items-end gap-3 border-t pt-4", DIVIDER)}>
        <p className={cn("w-full text-xs", FAINT)}>
          Students only — faculty and administrators are not in a class.
        </p>

        <div className="min-w-[180px] flex-1">
          <label htmlFor="departmentId" className={LABEL}>
            Department
          </label>
          <select
            id="departmentId"
            value={departmentId}
            disabled={orgDisabled}
            // Narrowing the parent invalidates whatever was chosen below it.
            onChange={(event) =>
              apply({ departmentId: event.target.value, batchId: "", classId: "" })
            }
            className={CONTROL_SM_SELECT}
          >
            <option value="">All departments</option>
            {tree.departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.code} — {department.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px] flex-1">
          <label htmlFor="batchId" className={LABEL}>
            Batch
          </label>
          <select
            id="batchId"
            value={batchId}
            disabled={orgDisabled}
            onChange={(event) => apply({ batchId: event.target.value, classId: "" })}
            className={CONTROL_SM_SELECT}
          >
            <option value="">All batches</option>
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px] flex-1">
          <label htmlFor="classId" className={LABEL}>
            Class
          </label>
          <select
            id="classId"
            value={classId}
            disabled={orgDisabled}
            onChange={(event) => apply({ classId: event.target.value })}
            className={CONTROL_SM_SELECT}
          >
            <option value="">All classes</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </form>
  );
}
