import { cn } from "@/lib/cn";

import { DISPLAY_HERO, MUTED, PANEL } from "./explore-ui";

export function ExploreIntro() {
  return (
    <header
      className={cn(
        PANEL,
        "relative bg-[#f4f8f5] px-4 py-3.5 sm:px-5 sm:py-4",
      )}
    >
      {/* Restrained lime accent */}
      <div
        className="pointer-events-none absolute bottom-3 left-0 top-3 w-1 rounded-full bg-[#c8ef5a]"
        aria-hidden="true"
      />

      <div className="flex flex-col gap-3 pl-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h1 className={DISPLAY_HERO}>
            Find an internship that fits you
          </h1>
          <p className={cn("mt-1 max-w-xl text-[15px] leading-snug sm:text-base", MUTED)}>
            Compare real work, costs, mentorship and outcomes shared by FISAT students.
          </p>
        </div>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 self-start rounded-md border border-[#c8ef5a]/35",
            "bg-white px-2.5 py-1.5 text-xs font-medium text-[#3d5210] sm:self-center",
          )}
        >
          <span className="h-1.5 w-1.5 shrink-0 rounded-sm bg-[#c8ef5a]" aria-hidden="true" />
          Faculty-verified experiences
        </span>
      </div>
    </header>
  );
}
