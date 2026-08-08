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
          <span className="inline-block max-w-full break-words rounded-lg border border-[var(--il-border)] bg-[var(--il-white)] px-2.5 py-0.5 text-xs font-medium text-[var(--il-moss)]">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
