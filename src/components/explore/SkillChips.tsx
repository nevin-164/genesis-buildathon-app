import { cn } from "@/lib/cn";

/** Compact chip list for domain or technology labels on explore cards. */
export function SkillChips({
  labels,
  className,
}: {
  labels: string[];
  className?: string;
}) {
  if (labels.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)} aria-label="Focus areas">
      {labels.map((label) => (
        <li key={label}>
          <span className="inline-block rounded border border-zinc-200/80 bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
