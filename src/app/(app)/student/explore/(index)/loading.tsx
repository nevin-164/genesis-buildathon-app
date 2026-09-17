/**
 * The Explore *list* skeleton, and it lives in the `(index)` group so that is
 * all it covers.
 *
 * At the `explore/` level it also wrapped `[id]`, which had two costs: a card
 * detail page flashed a grid-of-cards skeleton that looked nothing like it,
 * and — because a loading boundary makes Next start streaming immediately —
 * the response status was committed as 200 before `notFound()` could run, so
 * an unpublished internship answered 200 with not-found content instead of a
 * real 404.
 */

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

function CardSkeleton() {
  return (
    <div className={cn(PANEL, "overflow-hidden p-0")} aria-hidden="true">
      <SkeletonBlock className="h-[88px] rounded-none rounded-t-xl" />
      <div className="space-y-3 p-3.5">
        <SkeletonBlock className="h-3 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <SkeletonBlock className="h-6 w-24 rounded-md" />
        <SkeletonBlock className="h-3 w-full" />
      </div>
    </div>
  );
}

export default function ExploreLoading() {
  return (
    <StudentPageShell>
      <p className="sr-only" aria-busy="true" aria-live="polite">
        Loading internship experiences
      </p>

      <div className={cn(PANEL, "bg-[#f4f8f5] px-4 py-3.5 sm:px-5 sm:py-4")} aria-hidden="true">
        <SkeletonBlock className="h-8 w-2/3 max-w-md" />
        <SkeletonBlock className="mt-2 h-4 w-full max-w-xl" />
      </div>

      <div className={cn(PANEL, "p-2")} aria-hidden="true">
        <SkeletonBlock className="h-10 w-full rounded-lg" />
      </div>

      <div className="flex flex-wrap gap-2" aria-hidden="true">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-8 w-28 rounded-lg" />
        ))}
      </div>

      <div className={cn(PANEL, "p-4")} aria-hidden="true">
        <SkeletonBlock className="h-4 w-32" />
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-9 rounded-lg" />
          ))}
        </div>
      </div>

      <div
        className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
        aria-hidden="true"
      >
        <SkeletonBlock className="h-5 w-40" />
        <SkeletonBlock className="h-9 w-36 rounded-lg" />
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton key={index} />
        ))}
      </div>
    </StudentPageShell>
  );
}
