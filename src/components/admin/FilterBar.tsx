"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type FilterGroup = {
  /** The query-string key this dropdown writes, e.g. "departmentId". */
  key: string;
  label: string;
  options: { value: string; label: string }[];
  /** Label for the "no filter" option. */
  allLabel?: string;
};

/**
 * Dropdown filters that live in the URL, so a filtered view is linkable and
 * the page stays a Server Component.
 *
 * Wrapped in its own Suspense boundary because useSearchParams opts the tree
 * out of prerendering otherwise.
 */
export function FilterBar({ filters }: { filters: FilterGroup[] }) {
  return (
    <Suspense
      fallback={
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 h-[70px]" />
      }
    >
      <FilterBarInner filters={filters} />
    </Suspense>
  );
}

function FilterBarInner({ filters }: { filters: FilterGroup[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCount = filters.filter((f) => searchParams.get(f.key)).length;

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Any filter change invalidates the current page number.
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-end gap-4 shadow-sm">
      {filters.map((filter) => (
        <div key={filter.key} className="flex-1 min-w-[180px]">
          <label
            htmlFor={`filter-${filter.key}`}
            className="block text-xs font-medium text-slate-400 mb-1"
          >
            {filter.label}
          </label>
          <select
            id={`filter-${filter.key}`}
            value={searchParams.get(filter.key) ?? ""}
            onChange={(e) => setFilter(filter.key, e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="">{filter.allLabel ?? "All"}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => router.push(pathname)}
          className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 border border-slate-700 rounded-lg transition-colors cursor-pointer"
        >
          Clear filters ({activeCount})
        </button>
      )}
    </div>
  );
}
