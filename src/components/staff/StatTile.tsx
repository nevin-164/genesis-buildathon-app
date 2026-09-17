import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

import {
  EYEBROW,
  FAINT,
  FOCUS,
  FONT_DISPLAY,
  MOTION,
  type Tone,
} from "./staff-ui";

/**
 * A counted thing, on both dashboards.
 *
 * Admin and faculty were drawing this twice with different borders, type scales
 * and hover states. One tile means the number on the admin dashboard and the
 * number on the faculty one carry the same weight, which they should — they
 * often count the same rows.
 *
 * The tone tints only the number and the hairline at the top; the surface stays
 * the standard panel. Five differently-tinted card backgrounds in a row is what
 * made the old faculty dashboard read as a warning about something.
 */
const TONE_ACCENT: Record<Tone, { value: string; rule: string; hover: string }> = {
  lime: {
    value: "text-[#c8ef5a]",
    rule: "bg-[#c8ef5a]",
    hover: "hover:border-[#c8ef5a]/45",
  },
  mint: {
    value: "text-[#6ee7a5]",
    rule: "bg-[#6ee7a5]",
    hover: "hover:border-[#6ee7a5]/45",
  },
  amber: {
    value: "text-[#f5c563]",
    rule: "bg-[#f5c563]",
    hover: "hover:border-[#f5c563]/45",
  },
  rose: {
    value: "text-[#f79393]",
    rule: "bg-[#f79393]",
    hover: "hover:border-[#f79393]/45",
  },
  neutral: {
    value: "text-[#eaf2ec]",
    rule: "bg-[#3a5546]",
    hover: "hover:border-[#3a5546]",
  },
};

export function StatTile({
  value,
  label,
  hint,
  href,
  tone = "neutral",
  size = "normal",
  cta,
}: {
  value: ReactNode;
  label: string;
  hint?: string;
  href?: string;
  tone?: Tone;
  /** `lead` is for the one tile a screen is actually about. */
  size?: "normal" | "lead";
  /** Overrides the default "View →" caption on a linked tile. */
  cta?: string;
}) {
  const accent = TONE_ACCENT[tone];
  const isLead = size === "lead";

  const body = (
    <div
      className={cn(
        "relative h-full overflow-hidden rounded-xl border border-[#1b2a21] bg-[#0d1611]",
        isLead ? "p-5 sm:p-6" : "p-4 sm:p-5",
        MOTION,
        href && `${accent.hover} hover:bg-[#101a14]`,
      )}
    >
      {/* The tone lives in a 2px rule, not in the whole surface. */}
      <span
        aria-hidden="true"
        className={cn("absolute inset-x-0 top-0 h-0.5", accent.rule, tone === "neutral" && "opacity-60")}
      />

      <p className={cn(EYEBROW, "truncate")}>{label}</p>

      <p
        className={cn(
          FONT_DISPLAY,
          "mt-2 font-bold tabular-nums leading-none tracking-[-0.03em]",
          isLead ? "text-4xl sm:text-5xl" : "text-3xl",
          accent.value,
        )}
      >
        {value}
      </p>

      {hint && <p className={cn("mt-2 text-xs leading-snug", FAINT)}>{hint}</p>}

      {href && (
        <p className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-[#c8ef5a]">
          {cta ?? "View"}
          <span aria-hidden="true">&rarr;</span>
        </p>
      )}
    </div>
  );

  if (!href) return body;

  return (
    <Link href={href} className={cn("block rounded-xl no-underline", FOCUS)}>
      {body}
    </Link>
  );
}
