"use client";

import { useEffect } from "react";

import { StaffContent } from "@/components/staff/StaffShell";
import {
  BTN_SECONDARY,
  MUTED,
  PANEL_PADDED,
  SECTION_TITLE,
} from "@/components/staff/staff-ui";
import { cn } from "@/lib/cn";

interface FacultyErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function FacultyError({ error, retry }: FacultyErrorProps) {
  useEffect(() => {
    console.error("Faculty section runtime error:", error);
  }, [error]);

  return (
    <StaffContent width="narrow">
      <div
        className={cn(
          PANEL_PADDED,
          "border-[#4d2427] bg-[#2b1618] py-10 text-center sm:py-12",
        )}
      >
        <div
          aria-hidden="true"
          className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-[#5a2a2c] bg-[#3a1c1f] text-lg font-bold text-[#f79393]"
        >
          !
        </div>

        <h2 className={cn(SECTION_TITLE, "mt-4 text-lg")}>Something went wrong</h2>

        <p className={cn("mx-auto mt-2 max-w-md text-sm leading-relaxed", MUTED)}>
          {error.message || "An unexpected error occurred while loading faculty data."}
        </p>

        <div className="mt-6">
          <button type="button" onClick={() => retry()} className={BTN_SECONDARY}>
            Try again
          </button>
        </div>
      </div>
    </StaffContent>
  );
}
