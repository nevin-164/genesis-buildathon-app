import { StatTile } from "@/components/staff/StatTile";
import type { Tone } from "@/components/staff/staff-ui";

interface CountTileProps {
  count: number;
  label: string;
  sublabel?: string;
  href?: string;
  size?: "attention" | "normal";
  variant?: "amber" | "blue" | "green" | "red" | "gray" | "neutral";
}

/**
 * A counted thing on the faculty dashboard.
 *
 * The drawing lives in `staff/StatTile` now, shared with the admin dashboard —
 * the two were counting the same rows in two different visual languages. This
 * keeps its own props because five call sites use them, and maps the old colour
 * names onto the console's tones: there is no blue in this palette, and "the
 * thing waiting on you" is lime everywhere in the app.
 */
const VARIANT_TONE: Record<NonNullable<CountTileProps["variant"]>, Tone> = {
  blue: "lime",
  green: "mint",
  amber: "amber",
  red: "rose",
  gray: "neutral",
  neutral: "neutral",
};

export function CountTile({
  count,
  label,
  sublabel,
  href,
  size = "normal",
  variant = "neutral",
}: CountTileProps) {
  return (
    <StatTile
      value={count}
      label={label}
      hint={sublabel}
      href={href}
      tone={VARIANT_TONE[variant]}
      size={size === "attention" ? "lead" : "normal"}
      cta={size === "attention" ? "Review now" : undefined}
    />
  );
}
