export default function FacultyLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6 sm:p-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-48 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-4 w-72 rounded-md bg-slate-100 dark:bg-slate-800/60" />
      </div>

      {/* Tiles Skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="h-32 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40" />
        <div className="h-32 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40" />
      </div>

      {/* Content Block Skeleton */}
      <div className="h-64 rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-800/40" />
    </div>
  );
}
