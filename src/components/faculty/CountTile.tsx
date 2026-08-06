import Link from "next/link";

interface CountTileProps {
  count: number;
  label: string;
  sublabel?: string;
  href?: string;
  size?: "attention" | "normal";
  variant?: "amber" | "blue" | "green" | "red" | "gray" | "neutral";
}

export function CountTile({
  count,
  label,
  sublabel,
  href,
  size = "normal",
  variant = "neutral",
}: CountTileProps) {
  const isAttention = size === "attention";

  const variantStyles = {
    neutral: "border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100",
    amber: "border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200",
    blue: "border-blue-200 bg-blue-50/50 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200",
    green: "border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200",
    red: "border-rose-200 bg-rose-50/50 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-200",
    gray: "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300",
  };

  const content = (
    <div
      className={`rounded-xl border p-4 transition-all hover:shadow-sm ${
        variantStyles[variant]
      } ${isAttention ? "p-6" : "p-4"}`}
    >
      <div className={`font-bold tracking-tight ${isAttention ? "text-4xl" : "text-2xl"}`}>
        {count}
      </div>
      <div className={`mt-1 font-medium ${isAttention ? "text-base" : "text-sm text-slate-600 dark:text-slate-400"}`}>
        {label}
      </div>
      {sublabel && (
        <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sublabel}</div>
      )}
      {href && (
        <div className="mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          Review now &rarr;
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block no-underline">{content}</Link>;
  }

  return content;
}
