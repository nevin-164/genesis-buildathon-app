import { z } from "zod";

/**
 * Shared field builders for every package-3 schema.
 *
 * All of them **normalise before they validate**, using `z.preprocess`. This is
 * not a style preference — in zod v4 `.trim()` and `.toLowerCase()` are
 * transforms that run *after* the format check, so `z.email().trim()` rejects
 * "  a@b.com  " before it ever gets trimmed. Every value here arrives from a
 * FormData field, so it is always a string and usually a padded one.
 */

/** Trimmed text with a single message for both bounds. */
export function text(min: number, max: number, message: string) {
  return z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : v),
    z.string(message).min(min, message).max(max, message),
  );
}

/** Optional trimmed text. An empty field becomes null, never "". */
export function optionalText(max: number, message: string) {
  return z.preprocess((v) => {
    if (typeof v !== "string") return v ?? null;
    const trimmed = v.trim();
    return trimmed === "" ? null : trimmed;
  }, z.string().max(max, message).nullable());
}

/** Lower-cased and trimmed, which is also how it is stored. */
export const email = z.preprocess(
  (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
  z.email("Enter a valid email address."),
);

/** Upper-cased and trimmed — department codes. */
export function upperCode(min: number, max: number, message: string) {
  return z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toUpperCase() : v),
    z.string(message).min(min, message).max(max, message),
  );
}

export function uuid(message = "That is not a valid id.") {
  return z.uuid(message);
}

/**
 * A `<select>` whose blank option means "none". An empty string, null and
 * undefined all collapse to null, so "remove the advisor" and "never set one"
 * are the same value by the time a model sees them.
 */
export function optionalUuid(message = "Choose a valid option.") {
  return z.preprocess((v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "string" && v.trim() === "") return null;
    return v;
  }, z.uuid(message).nullable());
}

export function year(message = "Enter a valid four-digit year.") {
  return z.preprocess(
    (v) => (typeof v === "string" && v.trim() !== "" ? Number(v) : v),
    z.number(message).int(message).min(1900, message).max(2200, message),
  );
}

/**
 * An unchecked HTML checkbox sends nothing at all; a checked one sends "on".
 * Anything that is not an affirmative is false — never undefined, so a
 * superRefine can read it without a null check.
 */
export const checkbox = z.preprocess(
  (v) => v === true || v === "on" || v === "true" || v === "1",
  z.boolean(),
);

/** 1-based page number from a URL. Junk falls back to page 1. */
export const page = z.preprocess((v) => {
  const n = typeof v === "string" || typeof v === "number" ? Number(v) : NaN;
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}, z.number().int().min(1));

/**
 * The reason a student reads.
 *
 * The 10-character floor is deliberate and is also a database CHECK
 * (`verification_events_reason_ck`). Checking `IS NOT NULL` alone would let a
 * three-character brush-off through, which is the same as no reason at all.
 */
export const REASON_MIN = 10;
export const REASON_MESSAGE =
  "Give the student at least a sentence — 10 characters or more.";

/** Present but possibly empty. The action decides whether that is allowed. */
export const reason = z.preprocess(
  (v) => (typeof v === "string" ? v.trim() : ""),
  z.string().max(2000, "Keep the reason under 2000 characters."),
);
