/** Format fee and stipend amounts with explicit, student-friendly wording. */

import { cn } from "@/lib/cn";

import { INK, MOTION, MUTED } from "./explore-ui";

export function formatFee(amount: number | null): string {
  if (amount === null || amount === 0) return "No fee";
  return `Student paid ₹${amount.toLocaleString("en-IN")}`;
}

export function formatStipend(amount: number | null): string {
  if (amount === null || amount === 0) return "No stipend";
  return `Stipend ₹${amount.toLocaleString("en-IN")}`;
}

type CellTint = "neutral" | "mint" | "warm";

function MoneyCell({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: CellTint;
}) {
  const surface =
    tint === "mint"
      ? "border-[color-mix(in_srgb,var(--il-leaf)_35%,var(--il-border))] bg-[color-mix(in_srgb,var(--il-lime)_10%,var(--il-white))]"
      : tint === "warm"
        ? "border-[var(--il-border)] bg-[var(--il-ivory)]"
        : "border-[var(--il-border)] bg-[var(--il-canvas)]";

  return (
    <div
      className={cn(
        "flex flex-col justify-center rounded-lg border px-2.5 py-2",
        surface,
        MOTION,
      )}
    >
      <p className={cn("text-[10px] font-semibold uppercase tracking-[0.1em]", MUTED)}>
        {label}
      </p>
      <p className={cn("mt-0.5 text-[13px] font-bold leading-snug break-words sm:text-sm", INK)}>
        {value}
      </p>
    </div>
  );
}

export function MoneyLine({
  feeAmount,
  stipendAmount,
}: {
  feeAmount: number | null;
  stipendAmount: number | null;
}) {
  const feeText = formatFee(feeAmount);
  const stipendText = formatStipend(stipendAmount);
  const noFee = feeAmount === null || feeAmount === 0;
  const hasStipend = stipendAmount !== null && stipendAmount > 0;

  return (
    <div className="grid w-full grid-cols-2 items-stretch gap-2" aria-label="Financial details">
      <MoneyCell label="Fee" value={feeText} tint={noFee ? "mint" : "warm"} />
      <MoneyCell label="Stipend" value={stipendText} tint={hasStipend ? "mint" : "neutral"} />
    </div>
  );
}
