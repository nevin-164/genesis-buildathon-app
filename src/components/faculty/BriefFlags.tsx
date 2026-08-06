export interface BriefFlag {
  level: "warn" | "info";
  message: string;
}

interface BriefFlagsProps {
  flags?: BriefFlag[];
}

export function BriefFlags({ flags = [] }: BriefFlagsProps) {
  // Order warnings first, then info
  const sortedFlags = [...flags].sort((a, b) => {
    if (a.level === "warn" && b.level !== "warn") return -1;
    if (a.level !== "warn" && b.level === "warn") return 1;
    return 0;
  });

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        Things to Check
      </h3>
      {sortedFlags.length === 0 ? (
        <p className="text-sm text-slate-500 italic dark:text-slate-400">
          Nothing unusual.
        </p>
      ) : (
        <ul className="space-y-2">
          {sortedFlags.map((flag, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              {flag.level === "warn" ? (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-400">
                  !
                </span>
              ) : (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  i
                </span>
              )}
              <span
                className={
                  flag.level === "warn"
                    ? "font-medium text-amber-900 dark:text-amber-200"
                    : "text-slate-700 dark:text-slate-300"
                }
              >
                {flag.message}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
