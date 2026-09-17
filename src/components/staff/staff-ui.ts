/**
 * Staff console design tokens — admin and faculty.
 *
 * These screens used to be drawn in Tailwind's `slate`, which is a blue-violet
 * grey. Next to the student side — sage canvas, `#0f1812` ink, `#c8ef5a` lime —
 * it read as a different product. The ramp below is that same lime accent over
 * a green-black neutral, so the console is recognisably the dark half of one
 * app rather than a second one.
 *
 * The hue is held constant (~155deg) and only lightness moves, which is what
 * keeps a dark surface from going muddy: every step is the same colour, dimmed.
 *
 *   #080e0b  canvas       the field behind everything
 *   #0d1611  panel        cards, tables, forms
 *   #121e17  raised       table headers, hover, inset headers
 *   #1b2a21  line         borders
 *   #26382d  line strong  control borders, dividers that must be seen
 *   #eaf2ec  ink          primary text
 *   #a4b5aa  muted        secondary text
 *   #71857a  faint        labels, hints, metadata
 *   #c8ef5a  lime         the one accent — primary actions, links, focus
 *
 * Everything here is a class-name string rather than a component, so a screen
 * can drop one token onto an element it already owns without a rewrite.
 */

/* ─────────────── Raw values ─────────────── */

export const LIME = "#c8ef5a";
export const LIME_INK = "#0b120e";

/* ─────────────── Canvas ─────────────── */

/**
 * Full-bleed console background. Cancels the shell's `py-6 sm:py-8` with a
 * negative margin so the dark field runs up to the header, then puts the
 * padding back inside — the same trick STUDENT_PAGE_CANVAS uses.
 */
export const STAFF_CANVAS =
  "w-full min-w-0 bg-[#080e0b] -my-6 sm:-my-8 min-h-[calc(100dvh-3.5rem)] py-6 sm:py-8";

/** Inner column. Staff screens are dense tables, so they get the wider one. */
export const STAFF_CONTENT = "mx-auto w-full min-w-0 max-w-6xl px-4 sm:px-6 lg:px-8";

/** Narrower column for single-record screens (edit a user, manage a class). */
export const STAFF_CONTENT_NARROW = "mx-auto w-full min-w-0 max-w-3xl px-4 sm:px-6 lg:px-8";

/** Vertical rhythm between the sections of a staff page. */
export const STAFF_STACK = "space-y-5 sm:space-y-6";

/* ─────────────── Text ─────────────── */

/** Headline white. Brighter than INK so a title reads as the loudest thing on the screen. */
export const TITLE_INK = "text-[#f4f9f5]";
export const INK = "text-[#eaf2ec]";
export const MUTED = "text-[#a4b5aa]";
export const FAINT = "text-[#71857a]";
export const ACCENT = "text-[#c8ef5a]";

/** Sora, via the `--font-explore-display` variable StaffShell puts on the root. */
export const FONT_DISPLAY = "font-[family-name:var(--font-explore-display)]";

export const PAGE_TITLE = [
  FONT_DISPLAY,
  "text-[1.875rem] font-bold leading-[1.12] tracking-[-0.03em] sm:text-[2.125rem]",
  TITLE_INK,
].join(" ");

export const PAGE_SUBTITLE = `mt-1.5 max-w-2xl text-sm leading-relaxed ${MUTED}`;

/** The small all-caps label above a panel or a section. */
export const EYEBROW = `text-[11px] font-bold uppercase tracking-[0.14em] ${FAINT}`;

/**
 * The heading over a block of a page — "Your verifications", "Internships".
 *
 * These used to be drawn with EYEBROW, which is 11px faint small-caps. It is
 * the right treatment for a tile label and the wrong one for a heading: the
 * page came out as a wall of same-sized grey with nothing to scan by.
 */
export const SECTION_HEADING = [
  FONT_DISPLAY,
  "text-lg font-bold leading-tight tracking-[-0.02em] sm:text-xl",
  TITLE_INK,
].join(" ");

/** The heading inside a panel — one step down from SECTION_HEADING. */
export const SECTION_TITLE = [
  FONT_DISPLAY,
  "text-[15px] font-bold tracking-[-0.02em] sm:text-base",
  INK,
].join(" ");

/* ─────────────── Motion and focus ─────────────── */

export const MOTION =
  "transition-[color,background-color,border-color,box-shadow] duration-150 " +
  "motion-reduce:transition-none";

export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c8ef5a]/60 " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-[#080e0b]";

/* ─────────────── Surfaces ─────────────── */

export const PANEL =
  "rounded-xl border border-[#1b2a21] bg-[#0d1611] shadow-[0_1px_2px_rgba(0,0,0,0.4)]";

/** PANEL with its own padding, for a card that is just prose or a form. */
export const PANEL_PADDED = `${PANEL} p-5 sm:p-6`;

/** A panel whose children run to its edge — tables and lists. */
export const PANEL_FLUSH = `${PANEL} overflow-hidden`;

/** Header strip inside a flush panel. */
export const PANEL_HEADER =
  "flex flex-wrap items-center justify-between gap-3 border-b border-[#1b2a21] " +
  "bg-[#121e17] px-5 py-3.5 sm:px-6";

/** A quieter block inside a panel — an explanatory note, a footer form. */
export const INSET = "rounded-lg border border-[#1b2a21] bg-[#080e0b] p-3.5";

export const DIVIDER = "border-[#1b2a21]";

/* ─────────────── Tables ─────────────── */

export const TABLE_WRAP = "overflow-x-auto";
export const TABLE = "w-full text-left text-sm";

export const TABLE_HEAD =
  `border-b border-[#1b2a21] bg-[#121e17] text-[11px] font-bold uppercase tracking-[0.12em] ${FAINT}`;

export const TH = "whitespace-nowrap px-5 py-3 sm:px-6";

export const TBODY = "divide-y divide-[#16241c]";

export const TR = `${MOTION} hover:bg-[#121e17]`;

export const TD = `px-5 py-3.5 sm:px-6 ${MUTED}`;

/** First cell of a row — the thing the row is about. */
export const TD_PRIMARY = `px-5 py-3.5 sm:px-6 font-semibold ${INK}`;

export const MONO = "font-mono text-xs";

/* ─────────────── Controls ─────────────── */

/** Shared shape for input, select and textarea. */
export const CONTROL =
  "w-full min-w-0 rounded-lg border border-[#26382d] bg-[#080e0b] px-3 py-2 text-sm text-[#eaf2ec] " +
  "placeholder:text-[#5d6f66] hover:border-[#334c3d] " +
  "focus:border-[#c8ef5a]/60 focus:outline-none focus:ring-2 focus:ring-[#c8ef5a]/25 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  MOTION;

/** CONTROL for a <select>, which needs the pointer affordance. */
export const CONTROL_SELECT = `${CONTROL} cursor-pointer`;

/** Compact variant, for filter bars and inline row forms. */
export const CONTROL_SM =
  "w-full min-w-0 rounded-lg border border-[#26382d] bg-[#080e0b] px-3 py-1.5 text-sm text-[#eaf2ec] " +
  "placeholder:text-[#5d6f66] hover:border-[#334c3d] " +
  "focus:border-[#c8ef5a]/60 focus:outline-none focus:ring-2 focus:ring-[#c8ef5a]/25 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  MOTION;

export const CONTROL_SM_SELECT = `${CONTROL_SM} cursor-pointer`;

export const LABEL = `mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.1em] ${FAINT}`;

export const FIELD_ERROR = "mt-1.5 text-xs font-medium text-[#f79393]";
export const FIELD_HINT = `mt-1.5 text-xs ${FAINT}`;

/* ─────────────── Buttons ─────────────── */

const BTN_BASE =
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap " +
  "rounded-lg font-semibold disabled:cursor-not-allowed disabled:opacity-50 " +
  `${MOTION} ${FOCUS}`;

/** The one loud button on a screen. Lime fill, dark ink — as on Explore. */
export const BTN_PRIMARY =
  `${BTN_BASE} bg-[#c8ef5a] px-4 py-2 text-sm text-[#0b120e] hover:bg-[#d6f57c] active:bg-[#bde348]`;

export const BTN_PRIMARY_SM =
  `${BTN_BASE} bg-[#c8ef5a] px-3.5 py-1.5 text-xs text-[#0b120e] hover:bg-[#d6f57c]`;

/** Everything else. */
export const BTN_SECONDARY =
  `${BTN_BASE} border border-[#26382d] bg-[#121e17] px-4 py-2 text-sm text-[#cfdcd3] ` +
  "hover:border-[#3a5546] hover:bg-[#182720] hover:text-[#eaf2ec]";

export const BTN_SECONDARY_SM =
  `${BTN_BASE} border border-[#26382d] bg-[#121e17] px-3 py-1.5 text-xs text-[#cfdcd3] ` +
  "hover:border-[#3a5546] hover:bg-[#182720] hover:text-[#eaf2ec]";

/** Destructive. Muted on a dark field, so it warns without shouting. */
export const BTN_DANGER =
  `${BTN_BASE} border border-[#5a2a2c] bg-[#2b1618] px-4 py-2 text-sm text-[#f79393] ` +
  "hover:border-[#7a3a3d] hover:bg-[#3a1c1f] hover:text-[#ffb4b4]";

/** Reversible but consequential — deactivate, request changes. */
export const BTN_WARNING =
  `${BTN_BASE} border border-[#54471f] bg-[#2a2314] px-4 py-2 text-sm text-[#f5c563] ` +
  "hover:border-[#6d5c2a] hover:bg-[#372e1a] hover:text-[#ffd888]";

/** Inline text link inside a paragraph. */
export const LINK =
  `rounded-sm font-semibold text-[#c8ef5a] underline-offset-4 hover:underline ${MOTION} ${FOCUS}`;

/** The "Review →" link at the end of a table row. */
export const LINK_ACTION =
  `inline-flex items-center gap-1 text-xs font-bold text-[#c8ef5a] hover:text-[#daf78a] ${MOTION}`;

/** Back to the parent list. */
export const LINK_BACK =
  `inline-flex items-center gap-1.5 text-xs font-semibold ${FAINT} hover:text-[#c8ef5a] ${MOTION}`;

/* ─────────────── Status tones ─────────────── */

/**
 * One tone per meaning, shared by badges and tiles so a colour says the same
 * thing everywhere: lime waits on staff, amber waits on the student, mint is
 * published, rose is terminal, neutral is nothing-has-happened-yet.
 */
export type Tone = "lime" | "mint" | "amber" | "rose" | "neutral";

export const TONE_SOFT: Record<Tone, string> = {
  lime: "border-[#c8ef5a]/30 bg-[#c8ef5a]/10 text-[#d6f57c]",
  mint: "border-[#1d4733] bg-[#0e2a1c] text-[#6ee7a5]",
  amber: "border-[#54471f] bg-[#2a2314] text-[#f5c563]",
  rose: "border-[#4d2427] bg-[#2b1618] text-[#f79393]",
  neutral: "border-[#26382d] bg-[#121e17] text-[#a4b5aa]",
};

export const BADGE =
  "inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold";

export function badge(tone: Tone = "neutral"): string {
  return `${BADGE} ${TONE_SOFT[tone]}`;
}

/** A rectangular chip for codes and identifiers. */
export const CHIP_MONO =
  "inline-flex items-center rounded-md border border-[#26382d] bg-[#080e0b] px-2 py-0.5 font-mono text-xs text-[#a4b5aa]";

/* ─────────────── Notices ─────────────── */

export const NOTICE_INFO =
  `rounded-xl border border-[#1b2a21] bg-[#0d1611] p-4 text-sm leading-relaxed ${MUTED}`;

export const NOTICE_WARNING =
  "rounded-xl border border-[#54471f] bg-[#2a2314] p-4 text-sm leading-relaxed text-[#f0d29a]";

export const NOTICE_DANGER =
  "rounded-lg border border-[#4d2427] bg-[#2b1618] px-3 py-2 text-sm text-[#f79393]";

export const EMPTY = `px-6 py-12 text-center text-sm ${FAINT}`;

/** Action-result line under a form — mint when it worked, rose when it did not. */
export function formMessage(ok: boolean): string {
  return `text-xs font-semibold ${ok ? "text-[#6ee7a5]" : "text-[#f79393]"}`;
}
