import { cn } from "@/lib/cn";
import type { CompanyVerdict } from "@/types/contracts";

import {
  verdictChipLabel,
  verdictHeadline,
  verdictSubline,
  verdictTone,
  type VerdictTone,
} from "./company-verdict-text";
import { AlertIcon, ThumbDownIcon, ThumbUpIcon } from "./explore-icons";
import { INK, MOTION, MUTED } from "./explore-ui";

/**
 * What everyone who interned at this company said about it, shown on somebody
 * else's card.
 *
 * This is the point of the whole feature: a junior reading one enthusiastic
 * write-up should be able to see, without leaving the page, that four of the
 * six students who actually went there would tell them not to.
 *
 * The wording rules — when a percentage is allowed, what the denominator is
 * called — all live in `company-verdict-text.ts`, shared with the Compare view.
 */

const TONE_STYLES: Record<VerdictTone, { panel: string; icon: string }> = {
  negative: {
    panel: "border-[#e3b0a9] bg-[#fdf1ef] text-[#7f2d26]",
    icon: "text-[#a33f34]",
  },
  mixed: {
    panel: "border-[#e2d3a3] bg-[#fdf8ea] text-[#6b5720]",
    icon: "text-[#8a6f22]",
  },
  positive: {
    panel: "border-[#b8d4bc] bg-[#ecf8ee] text-[#2d5038]",
    icon: "text-[#3d6b4a]",
  },
};

/**
 * The full banner, for the Reality Card page.
 *
 * Rendered ABOVE the card it sits on, deliberately. Put below, it reads as a
 * footnote to a story the reader has already been won over by.
 */
export function CompanyVerdictBanner({
  verdict,
  companyName,
}: {
  verdict: CompanyVerdict | null;
  companyName: string;
}) {
  // Nobody has answered yet. Silence is the honest output — an empty state
  // reading "no ratings" only teaches students to expect a rating.
  if (!verdict) return null;

  const tone = verdictTone(verdict);
  const styles = TONE_STYLES[tone];
  const Icon =
    tone === "positive" ? ThumbUpIcon : tone === "mixed" ? ThumbDownIcon : AlertIcon;

  return (
    <aside
      className={cn("rounded-xl border px-4 py-3 sm:px-5", styles.panel)}
      aria-label={`What students say about ${companyName}`}
    >
      <div className="flex items-start gap-2.5">
        <span className={cn("mt-0.5 shrink-0", styles.icon)}>
          <Icon />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug">{verdictHeadline(verdict)}</p>
          <p className="mt-1 text-xs leading-relaxed opacity-80">{verdictSubline(tone)}</p>
          <p className="mt-1.5 text-[11px] font-medium tracking-wide opacity-70">
            {verdict.up} would recommend · {verdict.down} would not
          </p>
        </div>
      </div>
    </aside>
  );
}

/**
 * The one-line version for a card in the Explore grid.
 *
 * Only ever a WARNING — it renders nothing when every student was positive. A
 * grid of twelve cards each carrying a green "100% recommend" chip trains the
 * eye to skip the chip, and then the one card that needed to be noticed is not.
 */
export function CompanyVerdictChip({ verdict }: { verdict: CompanyVerdict | null }) {
  if (!verdict || verdict.down === 0) return null;

  const styles = TONE_STYLES[verdictTone(verdict)];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5",
        "text-[10px] font-semibold",
        MOTION,
        styles.panel,
      )}
    >
      <AlertIcon className="h-3 w-3 shrink-0 opacity-80" />
      {verdictChipLabel(verdict)}
    </span>
  );
}

/**
 * The student's OWN verdict, shown back to them on their card and to the
 * advisor reviewing it — so that what they said stays visible to the people it
 * affects, rather than only ever surfacing inside somebody else's average.
 */
export function OwnVerdictLine({ value }: { value: boolean | null }) {
  if (value === null) return null;

  return (
    <p className={cn("inline-flex items-center gap-1.5 text-sm font-medium", INK)}>
      <span className={value ? "text-[#3d6b4a]" : "text-[#a33f34]"}>
        {value ? <ThumbUpIcon /> : <ThumbDownIcon />}
      </span>
      {value ? "Would recommend this company" : "Would not recommend this company"}
      <span className={cn("text-xs font-normal", MUTED)}>— your verdict</span>
    </p>
  );
}
