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

export default function RealityCardLoading() {
  return (
    <StudentPageShell stack={false}>
      <p className="sr-only" aria-busy="true" aria-live="polite">
        Loading Reality Card
      </p>

      <div className="w-full min-w-0 space-y-4 sm:space-y-5" aria-hidden="true">
        <SkeletonBlock className="h-5 w-32" />
        <div className={cn(PANEL, "bg-[#f4f8f5] p-4 sm:p-5")}>
          <SkeletonBlock className="h-8 w-2/3 max-w-lg" />
          <SkeletonBlock className="mt-3 h-5 w-1/2" />
          <SkeletonBlock className="mt-4 h-4 w-full max-w-2xl" />
        </div>
        <div className={cn(PANEL, "p-4 sm:p-5")}>
          <SkeletonBlock className="h-5 w-40" />
          <SkeletonBlock className="mt-4 h-4 w-full" />
          <SkeletonBlock className="mt-2 h-4 w-5/6" />
        </div>
      </div>
    </StudentPageShell>
  );
}
