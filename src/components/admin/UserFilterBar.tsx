"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function UserFilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSearch = (q: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-sm">
      {/* SEARCH INPUT */}
      <div className="flex-1 min-w-[240px]">
        <input
          type="text"
          defaultValue={searchParams.get("q") ?? ""}
          placeholder="Search name or email..."
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 placeholder-slate-500"
        />
      </div>

      <div className="flex items-center gap-4">
        {/* ROLE FILTER */}
        <div className="flex items-center gap-2">
          <label htmlFor="role-select" className="text-xs font-medium text-slate-300">
            Role
          </label>
          <select
            id="role-select"
            value={searchParams.get("role") ?? ""}
            onChange={(e) => handleFilterChange("role", e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All</option>
            <option value="student">Student</option>
            <option value="faculty">Faculty</option>
            <option value="admin">Admin</option>
          </select>
        </div>

        {/* STATUS FILTER */}
        <div className="flex items-center gap-2">
          <label htmlFor="status-select" className="text-xs font-medium text-slate-300">
            Status
          </label>
          <select
            id="status-select"
            value={searchParams.get("isActive") ?? ""}
            onChange={(e) => handleFilterChange("isActive", e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>
    </div>
  );
}
