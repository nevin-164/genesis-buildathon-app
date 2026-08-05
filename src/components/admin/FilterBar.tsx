"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterGroup {
  key: string;
  label: string;
  options: FilterOption[];
  allLabel?: string;
}

interface FilterBarProps {
  filters: FilterGroup[];
}

export function FilterBar({ filters }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    // Reset pagination to page 1 on filter change if present
    if (params.has("page")) {
      params.set("page", "1");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
      <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider">
        Filter By:
      </span>
      {filters.map((group) => {
        const currentValue = searchParams.get(group.key) ?? "";
        return (
          <div key={group.key} className="flex items-center gap-2">
            <label
              htmlFor={`filter-${group.key}`}
              className="text-xs font-medium text-slate-300"
            >
              {group.label}
            </label>
            <select
              id={`filter-${group.key}`}
              value={currentValue}
              onChange={(e) => handleFilterChange(group.key, e.target.value)}
              className="px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="">{group.allLabel ?? `All ${group.label}s`}</option>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );
      })}
    </div>
  );
}
