import React from "react";

import { FAINT, INK } from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";

interface FactRowProps {
  label: string;
  value: React.ReactNode;
  highlighted?: boolean;
}

/**
 * One submitted fact, label left and value right.
 *
 * `highlighted` marks a value the reviewer is meant to check against a document
 * rather than read past — amber, the console's "wants a human" tone.
 */
export function FactRow({ label, value, highlighted = false }: FactRowProps) {
  return (
    <div
      className={cn(
        "flex flex-col justify-between gap-0.5 rounded-md px-2 py-1.5 sm:flex-row sm:items-baseline sm:gap-4",
        highlighted && "bg-[#2a2314] ring-1 ring-inset ring-[#54471f]",
      )}
    >
      <span
        className={cn(
          "text-[11px] font-bold uppercase tracking-[0.1em] sm:w-1/3 sm:shrink-0",
          highlighted ? "text-[#c9a961]" : FAINT,
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold leading-snug sm:w-2/3 sm:text-right",
          highlighted ? "text-[#f5c563]" : INK,
        )}
      >
        {value ?? "—"}
      </span>
    </div>
  );
}
