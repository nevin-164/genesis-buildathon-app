/**
 * Landing page tokens.
 *
 * Same palette as the rest of the product — green-black `#080e0b`, sage
 * `#e8ece4`, lime `#c8ef5a` — so the front door and the app behind it are
 * recognisably one thing. The dark half borrows the staff console's ramp; the
 * light half borrows Explore's.
 */

export const MOTION =
  "transition-[color,background-color,border-color,box-shadow,transform] duration-150 " +
  "motion-reduce:transition-none";

export const FOCUS_DARK =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#080e0b]";

export const FOCUS_LIGHT =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a] " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#e8ece4]";

/** Page column. Wider than the app shell — this is a marketing surface. */
export const SECTION = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8";

export const FONT_DISPLAY = "font-[family-name:var(--font-explore-display)]";

/** Small caps label above a section title. */
export const EYEBROW_DARK =
  "text-[11px] font-bold uppercase tracking-[0.16em] text-[#71857a]";
export const EYEBROW_LIGHT =
  "text-[11px] font-bold uppercase tracking-[0.16em] text-[#7c8b81]";

export const SECTION_TITLE = [
  FONT_DISPLAY,
  "text-[1.75rem] font-bold leading-[1.15] tracking-[-0.03em] sm:text-[2rem]",
].join(" ");

/* ─────────────── Buttons ─────────────── */

const BTN_BASE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg px-5 text-sm " +
  `font-semibold tracking-tight ${MOTION}`;

/** The loud one on a dark field: lime fill, dark ink. */
export const BTN_LIME =
  `${BTN_BASE} bg-[#c8ef5a] text-[#0b120e] hover:bg-[#d6f57c] active:bg-[#bde348] ${FOCUS_DARK}`;

/** Its quiet partner on the same field. */
export const BTN_ON_DARK =
  `${BTN_BASE} border border-[#26382d] bg-[#121e17] text-[#cfdcd3] ` +
  `hover:border-[#3a5546] hover:bg-[#182720] hover:text-[#eaf2ec] ${FOCUS_DARK}`;

/** The loud one on the sage field: dark green fill, lime focus. */
export const BTN_ON_LIGHT =
  `${BTN_BASE} bg-[#0f1812] text-white hover:bg-[#1a2e22] ` +
  `hover:shadow-[inset_0_0_0_1px_rgba(200,239,90,0.35)] active:bg-[#0a120e] ${FOCUS_LIGHT}`;

/* ─────────────── Surfaces ─────────────── */

export const CARD_LIGHT =
  "rounded-xl border border-[#cdd8cf] bg-white p-5 shadow-[0_1px_3px_rgba(15,24,18,0.05)]";

export const CARD_DARK = "rounded-xl border border-[#1b2a21] bg-[#0d1611] p-5";
