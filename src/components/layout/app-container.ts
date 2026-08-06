/** Shared authenticated shell width and horizontal gutters. */

/** 90rem (1440px) max width with responsive gutters: 16px → 24px → 32px. */
export const APP_CONTAINER =
  "mx-auto w-full min-w-0 max-w-[90rem] px-4 sm:px-6 lg:px-8";

export const APP_MAIN_PADDING = "py-6 sm:py-8";

/** Admin and faculty main column — matches the original app-shell main layout. */
export const STAFF_MAIN_CONTAINER = "mx-auto w-full min-w-0 max-w-6xl px-4";

/** Sticky header height — keep scroll-padding and min-heights in sync. */
export const APP_HEADER_HEIGHT = "h-14";

/** Alias — student page cards use the same column as the header inner bar. */
export const STUDENT_CONTENT = APP_CONTAINER;

/**
 * Full-width sage canvas inside app-shell main. Horizontal width is controlled
 * only by APP_CONTAINER on the child — no w-screen or negative-margin breakout.
 */
export const STUDENT_PAGE_CANVAS =
  "w-full min-w-0 bg-[#e8ece4] -my-6 sm:-my-8 min-h-[calc(100dvh-3.5rem)] py-6 sm:py-8";

/** Vertical rhythm inside STUDENT_CONTENT. */
export const STUDENT_PAGE_STACK = "space-y-4 sm:space-y-5";

export function initialsFromSessionName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "S";

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0][0]?.toUpperCase() ?? "S";
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
