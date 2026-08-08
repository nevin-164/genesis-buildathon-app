import { cn } from "@/lib/cn";

import { PANEL } from "@/components/explore/explore-ui";
import { StudentPageShell } from "@/components/layout/student-page-shell";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn("rounded-md bg-[#dde5dc]/55", className)}
      aria-hidden="true"
    />
  );
}

export default function CompareLoading() {
  return (
    <StudentPageShell>
      <p className="sr-only" aria-busy="true" aria-live="polite">
        Loading comparison
      </p>

      <div className={cn(PANEL, "bg-[#f4f8f5] px-4 py-4 sm:px-5 sm:py-5")} aria-hidden="true">
        <SkeletonBlock className="h-5 w-32" />
        <SkeletonBlock className="mt-3 h-8 w-2/3 max-w-md" />
        <SkeletonBlock className="mt-2 h-4 w-full max-w-xl" />
      </div>

      <div className={cn(PANEL, "p-4 sm:p-5")} aria-hidden="true">
        <SkeletonBlock className="h-10 w-full rounded-lg" />
        <SkeletonBlock className="mt-3 h-10 w-full rounded-lg" />
      </div>
    </StudentPageShell>
  );
}
