"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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
 * Search + role + status filters for the users directory. Everything is held
 * in the query string, so /admin/users?role=faculty is a shareable view and
 * the page itself stays a Server Component.
 */
export function UserFilterBar() {
  return (
    <Suspense
      fallback={
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[70px]" />
      }
    >
      <UserFilterBarInner />
    </Suspense>
  );
}

function UserFilterBarInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const role = searchParams.get("role") ?? "";
  const isActive = searchParams.get("isActive") ?? "";
  const hasFilters = Boolean(q || role || isActive);

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    // A changed filter invalidates the current page number.
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const value = new FormData(e.currentTarget).get("q");
        apply({ q: typeof value === "string" ? value.trim() : "" });
      }}
      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-end gap-4 shadow-sm"
    >
      <div className="flex-[2] min-w-[220px]">
        <label
          htmlFor="q"
          className="block text-xs font-medium text-slate-400 mb-1"
        >
          Search name or email
        </label>
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={q}
          key={q}
          placeholder="e.g. anjali or @example.com"
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div className="flex-1 min-w-[150px]">
        <label
          htmlFor="role"
          className="block text-xs font-medium text-slate-400 mb-1"
        >
          Role
        </label>
        <select
          id="role"
          name="role"
          value={role}
          onChange={(e) => apply({ role: e.target.value })}
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label
          htmlFor="isActive"
          className="block text-xs font-medium text-slate-400 mb-1"
        >
          Status
        </label>
        <select
          id="isActive"
          name="isActive"
          value={isActive}
          onChange={(e) => apply({ isActive: e.target.value })}
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="">Any status</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm rounded-lg transition-colors cursor-pointer shadow-sm"
      >
        Search
      </button>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          Clear
        </button>
      )}
    </form>
  );
}
