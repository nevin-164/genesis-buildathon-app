/** Format fee and stipend amounts with explicit, student-friendly wording. */

import { cn } from "@/lib/cn";

import { INK, MUTED_LIGHT } from "./explore-ui";

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
      ? "border-[#c8ef5a]/30 bg-[#f4faf0]"
      : tint === "warm"
        ? "border-[#e8e4dc] bg-[#faf9f7]"
        : "border-[#dde5dc] bg-[#f8faf8]";

  return (
    <div className={cn("flex h-full min-h-[3.25rem] flex-col justify-center rounded-lg border px-3 py-2", surface)}>
      <p className={cn("text-xs font-medium tracking-wide", MUTED_LIGHT)}>{label}</p>
      <p className={cn("mt-0.5 text-[13px] font-semibold leading-snug break-words sm:text-sm", INK)}>
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
