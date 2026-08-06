"use client";

/**
 * In Next 16 the prop is `retry`, not `reset`.
 *
 * Most controller errors are caught by `probe()` and rendered inline, which is
 * the point of the harness. This boundary is for the ones that escape — a
 * missing DATABASE_URL, a table that has not been migrated — where the stack is
 * the useful part.
 */
export default function DevError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-red-300 bg-red-50 p-4">
      <h2 className="font-mono text-sm font-semibold text-red-900">
        {error.name}: {error.message}
      </h2>
      {error.digest && (
        <p className="font-mono text-[11px] text-red-700">digest {error.digest}</p>
      )}
      <p className="text-xs text-red-800">
        If this mentions a relation that does not exist, run{" "}
        <code className="font-mono">npm run db:migrate</code> then{" "}
        <code className="font-mono">npm run db:seed</code>.
      </p>
      <button
        onClick={() => retry()}
        className="rounded bg-zinc-800 px-2.5 py-1 text-xs font-medium text-white"
      >
        Try again
      </button>
    </div>
  );
}
