"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  BTN_SECONDARY_SM,
  CONTROL_SM_SELECT,
  LABEL,
  PANEL,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";

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
    <Suspense fallback={<div className={cn(PANEL, "h-[78px]")} />}>
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
    <div className={cn(PANEL, "flex flex-wrap items-end gap-3 p-4")}>
      {filters.map((filter) => (
        <div key={filter.key} className="min-w-[180px] flex-1">
          <label htmlFor={`filter-${filter.key}`} className={LABEL}>
            {filter.label}
          </label>
          <select
            id={`filter-${filter.key}`}
            value={searchParams.get(filter.key) ?? ""}
            onChange={(e) => setFilter(filter.key, e.target.value)}
            className={CONTROL_SM_SELECT}
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
        <button type="button" onClick={() => router.push(pathname)} className={BTN_SECONDARY_SM}>
          Clear filters ({activeCount})
        </button>
      )}
    </div>
  );
}
