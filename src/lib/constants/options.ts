/**
 * Every dropdown in the app reads from here. Never hard-code an option list
 * inside a component — the backend validates against these exact values.
 */

export type Option = { value: string; label: string };

export const DOMAINS = [
  { value: "web", label: "Web Development" },
  { value: "mobile", label: "Mobile Development" },
  { value: "ml", label: "Machine Learning / AI" },
  { value: "data", label: "Data Science / Analytics" },
  { value: "cloud", label: "Cloud / DevOps" },
  { value: "embedded-iot", label: "Embedded Systems / IoT" },
  { value: "cybersecurity", label: "Cybersecurity" },
  { value: "ui-ux", label: "UI / UX Design" },
  { value: "testing", label: "Software Testing / QA" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

export const WORK_MODES = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
] as const satisfies readonly Option[];

export const WORK_NATURES = [
  { value: "training_only", label: "Training only" },
  { value: "guided_project", label: "Guided project" },
  { value: "real_work", label: "Real company work" },
] as const satisfies readonly Option[];

export const MENTOR_FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "occasional", label: "Occasionally" },
  { value: "never", label: "Never" },
] as const satisfies readonly Option[];

/** How the student applied to the company — not an internal approval stage. */
export const APPLICATION_SOURCES = [
  { value: "company_website", label: "Company website" },
  { value: "email", label: "Cold email" },
  { value: "referral", label: "Referral" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "job_portal", label: "Job portal" },
  { value: "college", label: "Through college" },
  { value: "other", label: "Other" },
] as const satisfies readonly Option[];

/**
 * Suggestions for `documents.doc_type`, rendered as a <datalist>. Unlike every
 * other list here the backend does NOT validate against these — the column is
 * free text so a student can attach something nobody thought of. They exist so
 * that the common cases are spelled the same way across the college.
 */
export const DOCUMENT_TYPES = [
  "Completion certificate",
  "Offer letter",
  "Logbook / weekly report",
  "Project report",
  "Payslip / stipend proof",
  // Appeal evidence. A rejected internship can still gain documents — that is
  // the whole point of an appeal — and these are what students actually attach.
  "Supervisor letter",
  "Email from the company",
] as const;

export const INTERNSHIP_STATUS_LABEL = {
  draft: "Draft",
  submitted: "Awaiting verification",
  changes_requested: "Changes requested",
  verified: "Published",
  rejected: "Rejected",
  appealed: "Appeal under review",
} as const;

/**
 * Badge colours. Keep these identical across every screen.
 *
 * `appealed` is blue for the same reason `submitted` is: blue means "with a
 * member of staff, nothing for you to do". Red is reserved for a decision that
 * has actually been taken against the student, and an appeal in flight is not
 * one — the rejection is no longer the live state.
 */
export const INTERNSHIP_STATUS_TONE = {
  draft: "gray",
  submitted: "blue",
  changes_requested: "amber",
  verified: "green",
  rejected: "red",
  appealed: "blue",
} as const;

export function labelFor(options: readonly Option[], value: string | null): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}
