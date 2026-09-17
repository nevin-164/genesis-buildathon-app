import type { InternshipDetail } from "@/types/contracts";

/**
 * The form's own shape: every field a string, because that is what an input
 * holds and what FormData posts. `actions.ts` turns these back into the typed
 * values the schemas want, and it is the only place that conversion happens.
 */
export type InternshipFormValues = {
  companyName: string;
  roleTitle: string;
  domain: string;
  workMode: string;
  location: string;
  startDate: string;
  endDate: string;
  feeAmount: string;
  stipendAmount: string;
  workNature: string;
  projectTitle: string;
  workSummary: string;
  /** "true" | "false" — a radio pair, never indeterminate. */
  hadMentor: string;
  mentorFrequency: string;
  /** Comma-separated. The schema trims, de-duplicates and caps at 20. */
  skillsBefore: string;
  skillsAfter: string;
  technologies: string;
  applicationSource: string;
  applicationProcess: string;
  /** "" | "true" | "false" — "" is "I'm not sure", and it stores as NULL. */
  beginnerFriendly: string;
  suitsWhom: string;
};

export const EMPTY_INTERNSHIP_FORM: InternshipFormValues = {
  companyName: "",
  roleTitle: "",
  domain: "",
  workMode: "",
  location: "",
  startDate: "",
  endDate: "",
  feeAmount: "",
  stipendAmount: "",
  workNature: "",
  projectTitle: "",
  workSummary: "",
  hadMentor: "false",
  mentorFrequency: "",
  skillsBefore: "",
  skillsAfter: "",
  technologies: "",
  applicationSource: "",
  applicationProcess: "",
  beginnerFriendly: "",
  suitsWhom: "",
};

/**
 * The inert defaults `createDraft` writes to satisfy the NOT NULL columns.
 * They are not answers the student gave, so the form shows them as blank
 * rather than as a role title somebody has to notice and delete.
 */
const DRAFT_SENTINEL_ROLE = "Untitled internship";

function money(amount: number | null): string {
  // null is "not disclosed" and 0 is "genuinely free". Rendering both as an
  // empty box would silently turn every free internship into an undisclosed
  // one the next time the student saved.
  return amount === null ? "" : String(amount);
}

function triState(value: boolean | null): string {
  return value === null ? "" : String(value);
}

/** Prefill the form from a saved internship. */
export function toFormValues(internship: InternshipDetail): InternshipFormValues {
  return {
    companyName: internship.companyName,
    roleTitle: internship.roleTitle === DRAFT_SENTINEL_ROLE ? "" : internship.roleTitle,
    domain: internship.domain,
    workMode: internship.workMode,
    location: internship.location ?? "",
    startDate: internship.startDate,
    endDate: internship.endDate,
    feeAmount: money(internship.feeAmount),
    stipendAmount: money(internship.stipendAmount),
    workNature: internship.workNature,
    projectTitle: internship.projectTitle ?? "",
    workSummary: internship.workSummary,
    hadMentor: String(internship.hadMentor),
    mentorFrequency: internship.mentorFrequency ?? "",
    skillsBefore: internship.skillsBefore.join(", "),
    skillsAfter: internship.skillsAfter.join(", "),
    technologies: internship.technologies.join(", "),
    applicationSource: internship.applicationSource ?? "",
    applicationProcess: internship.applicationProcess ?? "",
    beginnerFriendly: triState(internship.beginnerFriendly),
    suitsWhom: internship.suitsWhom ?? "",
  };
}

/** Whole weeks, rounded up — the same sum the server does on submit. */
export function previewDurationWeeks(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;

  const start = new Date(`${startDate}T00:00:00Z`).getTime();
  const end = new Date(`${endDate}T00:00:00Z`).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return null;

  return Math.max(0, Math.ceil((end - start) / (1000 * 60 * 60 * 24) / 7));
}
