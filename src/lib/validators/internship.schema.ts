import { z } from "zod";
import type { InternshipStatus } from "@/types/contracts";
import {
  DOMAINS,
  WORK_MODES,
  WORK_NATURES,
  MENTOR_FREQUENCIES,
  APPLICATION_SOURCES,
} from "@/lib/constants/options";

/* ── Enum values derived from frozen constants ──────────────────────────── */

/**
 * Keep the literal union, do not widen to `string`.
 *
 * `as [string, ...string[]]` compiles, but it throws the literals away — and
 * then `DraftInput["domain"]` is `string`, which no longer matches the pg enum
 * on the column. That mismatch is what forced `as any` on every drizzle
 * `.set()`, silently switching off type checking for the whole update.
 */
type Values<T extends readonly { value: string }[]> = [
  T[number]["value"],
  ...T[number]["value"][],
];

const domainValues = DOMAINS.map((d) => d.value) as Values<typeof DOMAINS>;
const workModeValues = WORK_MODES.map((w) => w.value) as Values<typeof WORK_MODES>;
const workNatureValues = WORK_NATURES.map((w) => w.value) as Values<typeof WORK_NATURES>;
const mentorFreqValues = MENTOR_FREQUENCIES.map((m) => m.value) as Values<
  typeof MENTOR_FREQUENCIES
>;
const appSourceValues = APPLICATION_SOURCES.map((s) => s.value) as Values<
  typeof APPLICATION_SOURCES
>;

/* ── Reusable field schemas ─────────────────────────────────────────────── */

/** YYYY-MM-DD date string with roundtrip validation to catch things like Feb 30. */
const dateField = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format")
  .refine((s) => {
    const d = new Date(s + "T00:00:00Z");
    return !isNaN(d.getTime()) && d.toISOString().startsWith(s);
  }, "Invalid date");

/**
 * Money in whole rupees.
 *   number ≥ 0 → value     (0 = genuinely free)
 *   null       → null      (not disclosed)
 *   ""         → null      (empty form field → not disclosed)
 */
const moneyField = z
  .union([z.number(), z.string(), z.null()])
  .transform((val): number | null => {
    if (val === null || val === "") return null;
    return typeof val === "number" ? val : Number(val);
  })
  .refine(
    (val) =>
      val === null || (Number.isFinite(val) && Number.isInteger(val) && val >= 0),
    "Must be a non-negative whole number or empty",
  );

/** Trim items, remove blanks, deduplicate, cap at 20. */
const stringArray = z
  .array(z.string())
  .optional()
  .default([])
  .transform((arr) =>
    [...new Set(arr.map((s) => s.trim()).filter(Boolean))].slice(0, 20),
  );

/* ── Editable-status helpers ────────────────────────────────────────────── */

export const EDITABLE_STATUSES: readonly InternshipStatus[] = [
  "draft",
  "changes_requested",
];

/** True when the internship can be edited or submitted. */
export function isEditable(status: InternshipStatus): boolean {
  return (EDITABLE_STATUSES as readonly string[]).includes(status);
}

/* ── Draft schema — permissive, for saving partial progress ─────────────── */

export const draftSchema = z.object({
  companyId: z.string().uuid().optional(),
  roleTitle: z.string().max(200).optional(),
  domain: z.enum(domainValues).optional(),
  workMode: z.enum(workModeValues).optional(),
  location: z.string().max(500).nullish(),
  startDate: dateField.optional(),
  endDate: dateField.optional(),
  feeAmount: moneyField.optional(),
  stipendAmount: moneyField.optional(),
  workNature: z.enum(workNatureValues).optional(),
  projectTitle: z.string().max(500).nullish(),
  workSummary: z.string().max(10000).optional(),
  hadMentor: z.boolean().optional(),
  mentorFrequency: z.enum(mentorFreqValues).nullish(),
  skillsBefore: stringArray,
  skillsAfter: stringArray,
  technologies: stringArray,
  applicationSource: z.enum(appSourceValues).nullish(),
  applicationProcess: z.string().max(5000).nullish(),
  beginnerFriendly: z.boolean().nullish(),
  suitsWhom: z.string().max(2000).nullish(),
});

export type DraftInput = z.infer<typeof draftSchema>;

/* ── Submit schema — strict, all required fields for publication ─────────── */

const submitBase = z.object({
  companyId: z.string().uuid({ message: "Select a company" }),
  roleTitle: z.string().min(2, "At least 2 characters").max(200),
  domain: z.enum(domainValues, { message: "Select a domain" }),
  workMode: z.enum(workModeValues, { message: "Select a work mode" }),
  location: z.string().max(500).nullish(),
  startDate: dateField,
  endDate: dateField,
  feeAmount: moneyField,
  stipendAmount: moneyField,
  workNature: z.enum(workNatureValues, { message: "Select work nature" }),
  projectTitle: z.string().max(500).nullish(),
  workSummary: z
    .string()
    .min(120, "Work summary must be at least 120 characters")
    .max(10000),
  hadMentor: z.boolean(),
  mentorFrequency: z.enum(mentorFreqValues).nullish(),
  skillsBefore: stringArray,
  skillsAfter: stringArray,
  technologies: stringArray,
  applicationSource: z.enum(appSourceValues).nullish(),
  applicationProcess: z.string().max(5000).nullish(),
  beginnerFriendly: z.boolean().nullish(),
  suitsWhom: z.string().max(2000).nullish(),
});

export const submitSchema = submitBase.superRefine((data, ctx) => {
  // Location required for non-remote
  if (data.workMode !== "remote" && !data.location?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["location"],
      message: "Location is required for on-site and hybrid internships",
    });
  }

  // End date ≥ start date
  if (data.startDate > data.endDate) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date must be on or after start date",
    });
  }

  // Dates cannot be in the future
  const today = new Date().toISOString().slice(0, 10);
  if (data.endDate > today) {
    ctx.addIssue({
      code: "custom",
      path: ["endDate"],
      message: "End date cannot be in the future",
    });
  }

  // Dates within 10 years of today
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  const floor = tenYearsAgo.toISOString().slice(0, 10);
  if (data.startDate < floor) {
    ctx.addIssue({
      code: "custom",
      path: ["startDate"],
      message: "Start date cannot be more than 10 years ago",
    });
  }

  // Mentor frequency required when hadMentor is true
  if (data.hadMentor && !data.mentorFrequency) {
    ctx.addIssue({
      code: "custom",
      path: ["mentorFrequency"],
      message: "Select how often you met your mentor",
    });
  }
});

export type SubmitInput = z.infer<typeof submitSchema>;

/* ── Respond schema — student's reply in a verification thread ──────────── */

export const respondSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Your response must be at least 10 characters")
    .max(5000),
});

export type RespondInput = z.infer<typeof respondSchema>;

/* ── Duration computation — always server-side, never trust the client ──── */

/** Weeks between two YYYY-MM-DD dates, rounded up. */
export function computeDurationWeeks(startDate: string, endDate: string): number {
  const start = new Date(startDate + "T00:00:00Z").getTime();
  const end = new Date(endDate + "T00:00:00Z").getTime();
  const days = (end - start) / (1000 * 60 * 60 * 24);
  return Math.max(0, Math.ceil(days / 7));
}

/* ── Row → form shape adapter (for canSubmit checks) ────────────────────── */

/**
 * Convert an internship row to the shape `submitSchema` expects.
 * Usage: `submitSchema.safeParse(toFormShape(row)).success`
 * This avoids duplicating business rules when computing canSubmit.
 */
export function toFormShape(row: {
  companyId: string;
  roleTitle: string;
  domain: string;
  workMode: string;
  location: string | null;
  startDate: string;
  endDate: string;
  feeAmount: number | null;
  stipendAmount: number | null;
  workNature: string;
  projectTitle: string | null;
  workSummary: string;
  hadMentor: boolean;
  mentorFrequency: string | null;
  skillsBefore: string[] | null;
  skillsAfter: string[] | null;
  technologies: string[] | null;
  applicationSource: string | null;
  applicationProcess: string | null;
  beginnerFriendly: boolean | null;
  suitsWhom: string | null;
}) {
  return {
    companyId: row.companyId,
    roleTitle: row.roleTitle,
    domain: row.domain,
    workMode: row.workMode,
    location: row.location,
    startDate: row.startDate,
    endDate: row.endDate,
    feeAmount: row.feeAmount,
    stipendAmount: row.stipendAmount,
    workNature: row.workNature,
    projectTitle: row.projectTitle,
    workSummary: row.workSummary,
    hadMentor: row.hadMentor,
    mentorFrequency: row.mentorFrequency,
    skillsBefore: row.skillsBefore ?? [],
    skillsAfter: row.skillsAfter ?? [],
    technologies: row.technologies ?? [],
    applicationSource: row.applicationSource,
    applicationProcess: row.applicationProcess,
    beginnerFriendly: row.beginnerFriendly,
    suitsWhom: row.suitsWhom,
  };
}
