import { StudentPageShell } from "@/components/layout/student-page-shell";
import { DIVIDER, EXPLORE_PAGE } from "@/components/student/student-ui";
import { cn } from "@/lib/cn";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-[color-mix(in_srgb,var(--il-border)_55%,var(--il-canvas))]",
        className,
      )}
      aria-hidden="true"
    />
  );
}

export default function ApplicationLoading() {
  return (
    <StudentPageShell>
      <div className={EXPLORE_PAGE}>
        <p className="sr-only" aria-busy="true" aria-live="polite">
          Loading applications
        </p>

        <header className="min-w-0" aria-hidden="true">
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-3 h-9 w-2/3 max-w-md" />
          <SkeletonBlock className="mt-2 h-4 w-full max-w-lg" />
          <div className={cn(DIVIDER, "mt-6 sm:mt-7")} />
        </header>

        <div className="grid min-w-0 lg:grid-cols-12" aria-hidden="true">
          <div className="space-y-4 py-5 lg:col-span-10 lg:col-start-2 xl:col-span-8 xl:col-start-3">
            <div className="flex gap-4">
              <SkeletonBlock className="h-16 w-16 shrink-0 rounded-2xl" />
              <div className="min-w-0 flex-1 space-y-2">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-6 w-3/4 max-w-xs" />
                <SkeletonBlock className="h-4 w-1/2 max-w-[12rem]" />
                <SkeletonBlock className="mt-4 h-px w-full" />
                <SkeletonBlock className="h-3 w-full max-w-sm" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentPageShell>
  );
}
