/** Explore-scoped design tokens — lime/mint palette, do not use outside this feature. */

export const MOTION =
  "transition-[color,background-color,border-color,box-shadow,transform] duration-150 " +
  "motion-reduce:transition-none";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a]/70 focus-visible:ring-offset-2";

/** Page shell — vertical rhythm between sections */
export const EXPLORE_PAGE = "space-y-4 sm:space-y-5";

/** Colours */
export const INK = "text-[#0f1812]";
export const MUTED = "text-[#5c6b62]";
export const MUTED_LIGHT = "text-[#8a968d]";
export const BORDER = "border-[#cdd8cf]";
export const PANEL_BG = "bg-white";
export const PAGE_TINT = "bg-[#e8ece4]";

/** Full-page Explore canvas — background only, no card chrome */
export const EXPLORE_ROOT =
  `${PAGE_TINT} min-w-0 -mx-4 -my-8 min-h-[calc(100dvh-3.5rem)] px-4 py-8`;

/** Hero */
export const HERO_BG = "bg-[#0f1812]";
export const HERO_INK = "text-white";
export const HERO_MUTED = "text-white/65";
export const LIME = "#c8ef5a";
export const LIME_TEXT = "text-[#c8ef5a]";

/** Surfaces */
export const PANEL =
  `rounded-xl border ${BORDER} ${PANEL_BG} shadow-[0_1px_3px_rgba(15,24,18,0.05)]`;

export const SEARCH_PANEL =
  "rounded-xl border border-[#cdd8cf] bg-white shadow-[0_10px_40px_rgba(15,24,18,0.10)]";

export const CONTROL =
  `h-9 w-full min-w-0 rounded-lg border ${BORDER} bg-white px-2.5 text-sm ${INK} ` +
  "hover:border-[#b5c4b8] focus-visible:border-[#9eb89e] focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[#c8ef5a]/45";

export const BTN_PRIMARY =
  "inline-flex h-10 shrink-0 items-center justify-center rounded-lg px-5 text-sm font-semibold " +
  "bg-[#0f1812] text-white hover:bg-[#1a2e22] hover:shadow-[inset_0_0_0_1px_#c8ef5a40] " +
  "active:bg-[#0a120e] focus-visible:ring-2 focus-visible:ring-[#c8ef5a] focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_GHOST =
  `inline-flex items-center justify-center rounded-lg border ${BORDER} bg-white px-3 py-1.5 ` +
  `text-xs font-medium ${INK} hover:border-[#b5c4b8] hover:bg-[#f4f8f0]`;

/** Quick filter chips */
export const QUICK_CHIP_ACTIVE =
  "border-[#c8ef5a] bg-[#0f1812] text-white shadow-[inset_3px_0_0_#c8ef5a]";

export const QUICK_CHIP_INACTIVE =
  `border ${BORDER} bg-white ${INK} hover:border-[#c8ef5a]/45 hover:bg-[#f0fae8]`;

/** Active filter summary chips */
export const CHIP_ACTIVE =
  "border-[#b8d94a] bg-[#ecfccb] text-[#3d5210] shadow-[inset_0_0_0_1px_rgba(200,239,90,0.3)]";

export const LABEL = `mb-1 block text-[10px] font-medium tracking-wide ${MUTED_LIGHT}`;

/** Sora display typography — requires exploreDisplay.variable on the page root */
export const FONT_DISPLAY = "font-[family-name:var(--font-explore-display)]";

export const DISPLAY_HERO = [
  FONT_DISPLAY,
  "font-bold leading-[1.15] tracking-[-0.025em]",
  INK,
  "text-[1.75rem] sm:text-[2rem] lg:text-[2.375rem]",
].join(" ");

export const DISPLAY_SECTION = [
  FONT_DISPLAY,
  "font-bold leading-[1.15] tracking-[-0.025em]",
  INK,
].join(" ");

/** Typography helpers (body font) */
export const SECTION_TITLE = `text-[15px] font-semibold tracking-tight ${INK}`;
export const DISPLAY_COMPANY = [
  FONT_DISPLAY,
  "text-[15px] font-bold leading-snug tracking-[-0.025em]",
  INK,
].join(" ");
export const CARD_COMPANY = DISPLAY_COMPANY;
export const CARD_ROLE = `text-[13px] font-medium leading-snug text-[#2a3d30]`;
