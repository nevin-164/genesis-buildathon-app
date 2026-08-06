import React from "react";

interface FactRowProps {
  label: string;
  value: React.ReactNode;
  highlighted?: boolean;
}

export function FactRow({ label, value, highlighted = false }: FactRowProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-baseline justify-between py-1.5 px-2 rounded ${
        highlighted ? "bg-amber-100/70 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200" : ""
      }`}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 sm:w-1/3">
        {label}
      </span>
      <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:w-2/3 sm:text-right">
        {value ?? "—"}
      </span>
    </div>
  );
}
