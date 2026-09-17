import { cn } from "@/lib/cn";

import { FONT_DISPLAY } from "./landing-ui";

/**
 * A mocked-up verified card, sitting beside the hero copy.
 *
 * It is the fastest way to explain the product: the claim on the left is
 * abstract until you can see the shape of the thing being claimed. Everything
 * in it is invented and it says so — an "Example" chip, a company that does not
 * exist — because a fabricated record that reads as a real one is a different
 * and worse thing than an illustration.
 */

const FACTS: { label: string; value: string; tone?: "lime" | "plain" }[] = [
  { label: "Stipend", value: "₹8,000 / month", tone: "lime" },
  { label: "Fee paid", value: "None" },
  { label: "Duration", value: "8 weeks · On-site" },
  { label: "Applied via", value: "Cold email" },
];

const CHIPS = ["Real company work", "Mentor met weekly", "Offer at the end"];

export function SampleCard() {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "w-full max-w-sm rounded-2xl border border-[#1f3128] bg-[#0d1611] p-5",
        "shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={cn(FONT_DISPLAY, "text-lg font-bold tracking-[-0.02em] text-[#eaf2ec]")}>
            Zephyr Labs
          </p>
          <p className="mt-0.5 text-[13px] font-medium text-[#a4b5aa]">
            Frontend Developer Intern
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#26382d] bg-[#121e17] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#71857a]">
          Example
        </span>
      </div>

      <dl className="mt-5 space-y-2.5 border-t border-[#1b2a21] pt-4">
        {FACTS.map((fact) => (
          <div key={fact.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-xs font-medium text-[#71857a]">{fact.label}</dt>
            <dd
              className={cn(
                "text-right text-[13px] font-semibold",
                fact.tone === "lime" ? "text-[#c8ef5a]" : "text-[#dbe6dd]",
              )}
            >
              {fact.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <span
            key={chip}
            className="rounded-md border border-[#26382d] bg-[#121e17] px-2 py-1 text-[11px] font-medium text-[#a4b5aa]"
          >
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-5 flex items-center gap-2 border-t border-[#1b2a21] pt-4">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6ee7a5]" />
        <p className="text-[11px] font-medium text-[#8a998f]">
          Verified by the class advisor · CSE 2022–26
        </p>
      </div>
    </div>
  );
}
