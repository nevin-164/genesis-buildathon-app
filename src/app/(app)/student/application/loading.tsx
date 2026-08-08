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

export default function ApplicationLoading() {
  return (
    <StudentPageShell>
      <p className="sr-only" aria-busy="true" aria-live="polite">
        Loading applications
      </p>

      <div className={cn(PANEL, "bg-[#f4f8f5] px-4 py-4 sm:px-5 sm:py-5")} aria-hidden="true">
        <SkeletonBlock className="h-8 w-2/3 max-w-md" />
        <SkeletonBlock className="mt-2 h-4 w-full max-w-xl" />
      </div>

      <div className={cn(PANEL, "p-4 sm:p-5")} aria-hidden="true">
        <SkeletonBlock className="h-6 w-1/2" />
        <SkeletonBlock className="mt-4 h-4 w-full" />
        <SkeletonBlock className="mt-2 h-4 w-3/4" />
      </div>
    </StudentPageShell>
  );
}
