import {
  APPLICATION_SOURCES,
  DOMAINS,
  WORK_MODES,
} from "@/lib/constants/options";
import type { ApplicationDetail, ApplicationSource, WorkMode } from "@/types/contracts";

export const MIN_ROLE_TITLE_LENGTH = 2;
export const MIN_EXPECTED_WORK_DRAFT = 10;
export const MIN_EXPECTED_WORK_SUBMIT = 30;
export const MIN_TECHNOLOGIES_SUBMIT = 1;
export const MAX_DURATION_WEEKS = 52;
export const MIN_DURATION_WEEKS = 1;

const DOMAIN_VALUES = new Set<string>(DOMAINS.map((option) => option.value));
const WORK_MODE_VALUES = new Set<string>(WORK_MODES.map((option) => option.value));
const SOURCE_VALUES = new Set<string>(APPLICATION_SOURCES.map((option) => option.value));

function formString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export type ApplicationFormValues = {
  companyId: string;
  roleTitle: string;
  domain: string;
  workMode: WorkMode;
  location: string | null;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  feeAmount: number | null;
  stipendAmount: number | null;
  expectedWork: string | null;
  technologies: string[];
  applicationSource: ApplicationSource | null;
  offerLetterEvidenceId: string | null;
};

export type ApplicationFormDefaults = {
  companyId: string;
  companyName: string;
  roleTitle: string;
  domain: string;
  workMode: WorkMode | "";
  location: string;
  startDate: string;
  endDate: string;
  durationWeeks: string;
  feeAmount: string;
  stipendAmount: string;
  expectedWork: string;
  technologies: string[];
  applicationSource: string;
  offerLetterEvidenceId: string;
};

function parseOptionalAmount(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.trunc(value);
}

function parseTechnologies(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry): entry is string => typeof entry === "string")
      .map((entry) => entry.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function parseApplicationFormData(formData: FormData): ApplicationFormValues {
  const companyId = formString(formData.get("companyId"));
  const roleTitle = formString(formData.get("roleTitle"));
  const domain = formString(formData.get("domain"));
  const workModeRaw = formString(formData.get("workMode"));
  const locationRaw = formString(formData.get("location"));
  const startDate = formString(formData.get("startDate"));
  const endDate = formString(formData.get("endDate"));
  const durationRaw = formString(formData.get("durationWeeks"));
  const expectedWorkRaw = formString(formData.get("expectedWork"));
  const applicationSourceRaw = formString(formData.get("applicationSource"));
  const offerLetterEvidenceIdRaw = formString(formData.get("offerLetterEvidenceId"));

  const durationWeeks = durationRaw ? Number(durationRaw) : Number.NaN;
  const feeAmount = parseOptionalAmount(formData.get("feeAmount"));
  const stipendAmount = parseOptionalAmount(formData.get("stipendAmount"));
  const technologies = parseTechnologies(formData.get("technologies"));

  const workMode = WORK_MODE_VALUES.has(workModeRaw)
    ? (workModeRaw as WorkMode)
    : ("" as WorkMode);
  const applicationSource = SOURCE_VALUES.has(applicationSourceRaw)
    ? (applicationSourceRaw as ApplicationSource)
    : null;

  return {
    companyId,
    roleTitle,
    domain,
    workMode,
    location: locationRaw ? locationRaw : null,
    startDate,
    endDate,
    durationWeeks,
    feeAmount,
    stipendAmount,
    expectedWork: expectedWorkRaw ? expectedWorkRaw : null,
    technologies,
    applicationSource,
    offerLetterEvidenceId: offerLetterEvidenceIdRaw ? offerLetterEvidenceIdRaw : null,
  };
}

function validateDates(
  values: ApplicationFormValues,
  errors: Record<string, string>,
  requireAll: boolean,
) {
  if (requireAll && !values.startDate) {
    errors.startDate = "Enter a start date.";
  }
  if (requireAll && !values.endDate) {
    errors.endDate = "Enter an end date.";
  }
  if (values.startDate && values.endDate) {
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);
    if (Number.isNaN(start.getTime())) {
      errors.startDate = "Enter a valid start date.";
    }
    if (Number.isNaN(end.getTime())) {
      errors.endDate = "Enter a valid end date.";
    }
    if (!errors.startDate && !errors.endDate && end <= start) {
      errors.endDate = "End date must be after the start date.";
    }
  }
}

function validateDuration(
  values: ApplicationFormValues,
  errors: Record<string, string>,
  requireAll: boolean,
) {
  if (requireAll && Number.isNaN(values.durationWeeks)) {
    errors.durationWeeks = "Enter the internship duration in weeks.";
    return;
  }
  if (Number.isNaN(values.durationWeeks)) return;

  if (!Number.isInteger(values.durationWeeks)) {
    errors.durationWeeks = "Duration must be a whole number of weeks.";
    return;
  }
  if (values.durationWeeks < MIN_DURATION_WEEKS) {
    errors.durationWeeks = `Duration must be at least ${MIN_DURATION_WEEKS} week.`;
  }
  if (values.durationWeeks > MAX_DURATION_WEEKS) {
    errors.durationWeeks = `Duration must be ${MAX_DURATION_WEEKS} weeks or fewer.`;
  }
}

function validateMoney(values: ApplicationFormValues, errors: Record<string, string>) {
  if (values.feeAmount !== null && Number.isNaN(values.feeAmount)) {
    errors.feeAmount = "Enter a valid fee amount or leave blank.";
  } else if (values.feeAmount !== null && values.feeAmount < 0) {
    errors.feeAmount = "Fee cannot be negative.";
  }

  if (values.stipendAmount !== null && Number.isNaN(values.stipendAmount)) {
    errors.stipendAmount = "Enter a valid stipend amount or leave blank.";
  } else if (values.stipendAmount !== null && values.stipendAmount < 0) {
    errors.stipendAmount = "Stipend cannot be negative.";
  }
}

export function validateApplicationDraft(
  values: ApplicationFormValues,
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (values.roleTitle && values.roleTitle.length < MIN_ROLE_TITLE_LENGTH) {
    errors.roleTitle = `Role title must be at least ${MIN_ROLE_TITLE_LENGTH} characters.`;
  }

  if (values.domain && !DOMAIN_VALUES.has(values.domain)) {
    errors.domain = "Choose a valid domain.";
  }

  if (values.workMode && !WORK_MODE_VALUES.has(values.workMode)) {
    errors.workMode = "Choose a valid work mode.";
  }

  if (
    values.expectedWork &&
    values.expectedWork.length < MIN_EXPECTED_WORK_DRAFT
  ) {
    errors.expectedWork = `Add at least ${MIN_EXPECTED_WORK_DRAFT} characters describing the work.`;
  }

  validateDates(values, errors, false);
  validateDuration(values, errors, false);
  validateMoney(values, errors);

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateApplicationSubmit(
  values: ApplicationFormValues,
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (!values.companyId) {
    errors.companyId = "Select or add the internship company.";
  }

  if (!values.roleTitle) {
    errors.roleTitle = "Enter the internship role title.";
  } else if (values.roleTitle.length < MIN_ROLE_TITLE_LENGTH) {
    errors.roleTitle = `Role title must be at least ${MIN_ROLE_TITLE_LENGTH} characters.`;
  }

  if (!values.domain) {
    errors.domain = "Choose a domain.";
  } else if (!DOMAIN_VALUES.has(values.domain)) {
    errors.domain = "Choose a valid domain.";
  }

  if (!values.workMode) {
    errors.workMode = "Choose a work mode.";
  }

  if (values.workMode === "onsite" || values.workMode === "hybrid") {
    if (!values.location?.trim()) {
      errors.location = "Enter the internship location.";
    }
  }

  validateDates(values, errors, true);
  validateDuration(values, errors, true);
  validateMoney(values, errors);

  if (!values.expectedWork) {
    errors.expectedWork = "Describe the expected work and responsibilities.";
  } else if (values.expectedWork.length < MIN_EXPECTED_WORK_SUBMIT) {
    errors.expectedWork = `Describe the work in at least ${MIN_EXPECTED_WORK_SUBMIT} characters.`;
  }

  if (values.technologies.length < MIN_TECHNOLOGIES_SUBMIT) {
    errors.technologies = "Add at least one technology or tool.";
  }

  if (!values.applicationSource) {
    errors.applicationSource = "Choose how you secured this internship.";
  }

  if (!values.offerLetterEvidenceId) {
    errors.offerLetter = "Attach your offer letter before submitting.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function toApplicationInput(values: ApplicationFormValues): Record<string, unknown> {
  return {
    companyId: values.companyId,
    roleTitle: values.roleTitle,
    domain: values.domain,
    workMode: values.workMode,
    location: values.location,
    startDate: values.startDate,
    endDate: values.endDate,
    durationWeeks: values.durationWeeks,
    feeAmount: values.feeAmount,
    stipendAmount: values.stipendAmount,
    expectedWork: values.expectedWork,
    technologies: values.technologies,
    applicationSource: values.applicationSource,
    offerLetterEvidenceId: values.offerLetterEvidenceId,
  };
}

export function weeksBetweenDates(startDate: string, endDate: string): number | null {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return null;
  }
  const diffDays = Math.round((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  return Math.max(MIN_DURATION_WEEKS, Math.ceil(diffDays / 7));
}

export function applicationToFormDefaults(
  application: ApplicationDetail,
): ApplicationFormDefaults {
  return {
    companyId: application.companyId,
    companyName: application.companyName,
    roleTitle: application.roleTitle,
    domain: application.domain,
    workMode: application.workMode,
    location: application.location ?? "",
    startDate: application.startDate,
    endDate: application.endDate,
    durationWeeks: application.durationWeeks > 0 ? String(application.durationWeeks) : "",
    feeAmount: application.feeAmount === null ? "" : String(application.feeAmount),
    stipendAmount:
      application.stipendAmount === null ? "" : String(application.stipendAmount),
    expectedWork: application.expectedWork ?? "",
    technologies: application.technologies,
    applicationSource: application.applicationSource ?? "",
    offerLetterEvidenceId: application.offerLetter?.id ?? "",
  };
}
