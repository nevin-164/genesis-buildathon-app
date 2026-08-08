/**
 * InternLens student design system v2 — composition-first tokens.
 * Uses CSS variables from .student-shell in globals.css.
 */

export const MOTION =
  "transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 " +
  "motion-reduce:transition-none";

export const MOTION_FAST =
  "transition-[color,background-color,border-color,box-shadow,transform] duration-150 " +
  "motion-reduce:transition-none";

export const HOVER_LIFT =
  "motion-reduce:hover:translate-y-0 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(20,38,27,0.10)]";

export const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--il-lime)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--il-canvas)]";

/* Typography */
export const FONT_DISPLAY = "font-[family-name:var(--font-student-display)]";
export const FONT_BODY = "font-[family-name:var(--font-student-body)]";

export const INK = "text-[var(--il-ink)]";
export const INK_SOFT = "text-[var(--il-moss)]";
export const MUTED = "text-[color-mix(in_srgb,var(--il-muted)_88%,var(--il-ink))]";
export const MUTED_LIGHT = "text-[color-mix(in_srgb,var(--il-muted)_72%,var(--il-ink))]";

export const EYEBROW =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--il-leaf)]";

/** Major page-level headings — sentence case display scale. */
export const PAGE_DISPLAY_HEADING = [
  FONT_DISPLAY,
  "text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--il-ink)] sm:text-4xl",
].join(" ");

/** Dashboard greeting — same display scale as page headings. */
export const GREETING_DISPLAY = [
  FONT_DISPLAY,
  "text-3xl font-semibold leading-[1.1] tracking-[-0.025em] text-[var(--il-ink)] sm:text-4xl",
].join(" ");

export const DISPLAY_TITLE = PAGE_DISPLAY_HEADING;

/** Entity mastheads — company names stay sentence case. */
export const DISPLAY_TITLE_SM = [
  FONT_DISPLAY,
  "text-[clamp(1.375rem,3vw,1.875rem)] font-semibold leading-[1.12] tracking-[-0.025em] text-[var(--il-ink)]",
].join(" ");

/** 24–32px gap between heading region and first content section. */
export const PAGE_CONTENT_GAP = "mb-6 sm:mb-8";

export const SECTION_TITLE = [
  FONT_DISPLAY,
  "text-[1.05rem] font-semibold leading-snug tracking-[-0.02em] text-[var(--il-ink)] sm:text-lg",
].join(" ");

export const BODY_LEAD =
  "max-w-[42rem] text-[15px] leading-[1.65] text-[var(--il-muted)] sm:text-base";

export const BODY = "text-sm leading-[1.65] text-[var(--il-ink)]";
export const META = "text-xs leading-relaxed text-[var(--il-muted)]";

export const LABEL =
  "mb-1.5 block text-xs font-medium tracking-wide text-[var(--il-muted)]";

/* Legacy aliases */
export const PAGE_TITLE = DISPLAY_TITLE;
export const PAGE_TITLE_COMPACT = DISPLAY_TITLE_SM;
export const PAGE_LEAD = BODY_LEAD;
export const DISPLAY_HERO = DISPLAY_TITLE;
export const DISPLAY_SECTION = SECTION_TITLE;
export const DISPLAY_COMPANY = [
  FONT_DISPLAY,
  "text-[15px] font-semibold leading-snug tracking-[-0.02em] text-[var(--il-ink)] sm:text-base",
].join(" ");
export const CARD_COMPANY = DISPLAY_COMPANY;
export const CARD_ROLE = "text-[13px] font-medium leading-snug text-[var(--il-moss)]";

/* Surfaces — use sparingly */
export const BORDER = "border-[var(--il-border)]";
export const BORDER_STRONG = "border-[color-mix(in_srgb,var(--il-ink)_18%,var(--il-border))]";

/** Level 2 — one major white editorial sheet for a record or report. */
export const EDITORIAL_SHEET =
  "min-w-0 rounded-[24px] border border-[var(--il-border)] bg-[var(--il-white)] " +
  "shadow-[0_18px_45px_rgba(20,38,27,0.07)]";

/** Level 2 variant — warm ivory discovery / secondary sheets. */
export const EDITORIAL_SHEET_IVORY =
  "min-w-0 rounded-[24px] border border-[var(--il-border)] bg-[var(--il-ivory)] " +
  "shadow-[0_18px_45px_rgba(20,38,27,0.07)]";

export const EDITORIAL_SHEET_PAD = "p-5 sm:p-8 lg:px-10 lg:py-9";
export const WORKFLOW_SHEET = EDITORIAL_SHEET;
export const WORKFLOW_SHEET_PAD = "p-5 sm:p-6 lg:p-7";

/** Small inset panel for grouped objects only */
export const INSET =
  "rounded-xl border border-[var(--il-border)] bg-[var(--il-ivory)] shadow-[0_1px_2px_rgba(20,38,27,0.04)]";

/** Legacy card — avoid for page sections */
export const SURFACE = INSET;
export const PANEL = INSET;

export const INSET_MINT =
  "rounded-xl border border-[color-mix(in_srgb,var(--il-lime)_35%,var(--il-border))] bg-[color-mix(in_srgb,var(--il-lime)_8%,var(--il-ivory))]";

export const INSET_ATTENTION =
  "rounded-xl border border-[color-mix(in_srgb,var(--il-amber)_35%,var(--il-border))] bg-[var(--il-amber-pale)]";

export const INSET_ERROR =
  "rounded-xl border border-[color-mix(in_srgb,var(--il-error)_30%,var(--il-border))] bg-[var(--il-error-pale)]";

export const INSET_NEUTRAL =
  "rounded-xl border border-[var(--il-border)] bg-[color-mix(in_srgb,var(--il-ivory)_85%,var(--il-white))]";

export const INSET_DARK =
  "rounded-xl bg-[var(--il-ink)] text-[var(--il-ivory)] shadow-[0_16px_48px_rgba(20,38,27,0.22)]";

export const SURFACE_TINTED = INSET_MINT;
export const SURFACE_MINT = INSET_MINT;
export const SURFACE_ATTENTION = INSET_ATTENTION;
export const SURFACE_REJECTED = INSET_ERROR;
export const SURFACE_SUCCESS = INSET_MINT;
export const SURFACE_DARK = INSET_DARK;
export const SURFACE_ELEVATED =
  "rounded-xl border border-[var(--il-border)] bg-[var(--il-white)] shadow-[0_8px_30px_rgba(20,38,27,0.08)]";

export const SEARCH_FLOAT =
  "rounded-2xl border border-[var(--il-border)] bg-[var(--il-white)] shadow-[0_16px_48px_rgba(20,38,27,0.10)]";

export const PANEL_BG = "bg-[var(--il-white)]";
export const PAGE_TINT = "bg-[var(--il-canvas)]";

export const ACCENT_LIME = "bg-[var(--il-lime)]";
export const ACCENT_AMBER = "bg-[var(--il-amber)]";
export const ACCENT_RED = "bg-[var(--il-error)]";
export const ACCENT_BLUE = "bg-[var(--il-teal)]";

export const CONTROL =
  "min-h-11 w-full min-w-0 rounded-xl border border-[var(--il-border)] bg-[var(--il-white)] px-3.5 text-sm text-[var(--il-ink)] " +
  "hover:border-[color-mix(in_srgb,var(--il-leaf)_40%,var(--il-border))] focus-visible:border-[var(--il-leaf)] focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-[color-mix(in_srgb,var(--il-lime)_50%,transparent)] disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_PRIMARY =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl px-5 text-sm font-semibold " +
  "bg-[var(--il-ink)] text-[var(--il-ivory)] hover:bg-[var(--il-moss)] " +
  "active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--il-lime)] focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:active:scale-100";

export const BTN_SECONDARY =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--il-border)] bg-[var(--il-white)] px-4 " +
  "text-sm font-semibold text-[var(--il-ink)] hover:border-[var(--il-leaf)] hover:bg-[var(--il-ivory)] " +
  "active:bg-[color-mix(in_srgb,var(--il-canvas)_50%,var(--il-white))] disabled:cursor-not-allowed disabled:opacity-60";

export const BTN_GHOST = BTN_SECONDARY;

export const BTN_QUIET =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-sm font-medium text-[var(--il-muted)] " +
  "hover:bg-[color-mix(in_srgb,var(--il-canvas)_60%,var(--il-white))] hover:text-[var(--il-ink)]";

export const BTN_LIME =
  "inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-bold " +
  "bg-[var(--il-lime)] text-[var(--il-ink)] hover:brightness-105 active:brightness-95";

export const QUICK_CHIP_ACTIVE =
  "border-[var(--il-ink)] bg-[var(--il-ink)] text-[var(--il-ivory)] shadow-[inset_3px_0_0_var(--il-lime)]";

export const QUICK_CHIP_INACTIVE =
  "border border-[var(--il-border)] bg-[var(--il-white)] text-[var(--il-ink)] hover:border-[color-mix(in_srgb,var(--il-lime)_45%,var(--il-border))] hover:bg-[color-mix(in_srgb,var(--il-lime)_6%,var(--il-white))]";

export const CHIP_ACTIVE =
  "border border-[color-mix(in_srgb,var(--il-lime)_50%,var(--il-border))] bg-[color-mix(in_srgb,var(--il-lime)_12%,var(--il-white))] text-[var(--il-moss)]";

export const CARD_PAD = "p-4 sm:p-5";
export const CARD_PAD_COMPACT = "p-3 sm:p-3.5";
export const CARD_HOVER = HOVER_LIFT;

export const DIVIDER = "h-px bg-[var(--il-border)]";
export const DIVIDER_STRONG = "h-px bg-[color-mix(in_srgb,var(--il-ink)_12%,var(--il-border))]";

export const EXPLORE_PAGE = "space-y-6 sm:space-y-8";
export const STUDENT_PAGE_SECTIONS = EXPLORE_PAGE;
export const EXPLORE_ROOT =
  "min-w-0 w-full -my-6 sm:-my-8 min-h-[calc(100dvh-3.5rem)] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 bg-[var(--il-canvas)]";

export const HERO_BG = "bg-[var(--il-ink)]";
export const HERO_INK = "text-[var(--il-ivory)]";
export const HERO_MUTED = "text-[color-mix(in_srgb,var(--il-ivory)_72%,transparent)]";
export const LIME_TEXT = "text-[var(--il-lime)]";
export const LIME_MUTED = "text-[color-mix(in_srgb,var(--il-lime)_75%,var(--il-muted))]";
export const LIME = "#c7f36b";

export const SECTION_TITLE_LEGACY = SECTION_TITLE;

export const SEARCH_PANEL = SEARCH_FLOAT;
