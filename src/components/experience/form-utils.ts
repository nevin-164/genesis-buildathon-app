import {
  APPLICATION_SOURCES,
  DOMAINS,
  MENTOR_FREQUENCIES,
  WORK_MODES,
  WORK_NATURES,
} from "@/lib/constants/options";
import { weeksBetweenDates } from "@/components/application/form-utils";
import type {
  ApplicationSource,
  ExperienceDetail,
  MentorFrequency,
  WorkMode,
  WorkNature,
} from "@/types/contracts";

export { weeksBetweenDates };

export const MIN_WORK_SUMMARY_DRAFT = 10;
export const MIN_WORK_SUMMARY_SUBMIT = 50;
export const MIN_APPLICATION_PROCESS_DRAFT = 10;
export const MIN_APPLICATION_PROCESS_SUBMIT = 20;
export const MIN_SUITS_WHOM_DRAFT = 10;
export const MIN_SUITS_WHOM_SUBMIT = 20;
export const MIN_TAG_COUNT_SUBMIT = 1;
export const MAX_DURATION_WEEKS = 52;
export const MIN_DURATION_WEEKS = 1;

const DOMAIN_VALUES = new Set<string>(DOMAINS.map((option) => option.value));
const WORK_MODE_VALUES = new Set<string>(WORK_MODES.map((option) => option.value));
const WORK_NATURE_VALUES = new Set<string>(WORK_NATURES.map((option) => option.value));
const SOURCE_VALUES = new Set<string>(APPLICATION_SOURCES.map((option) => option.value));
const MENTOR_FREQUENCY_VALUES = new Set<string>(
  MENTOR_FREQUENCIES.map((option) => option.value),
);

function formString(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseOptionalAmount(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return Number.NaN;
  return Math.trunc(value);
}

function parseTagList(raw: FormDataEntryValue | null): string[] {
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

function parseBooleanChoice(raw: string): boolean | null {
  if (raw === "true") return true;
  if (raw === "false") return false;
  return null;
}

export type ExperienceFormValues = {
  domain: string;
  workMode: WorkMode | "";
  location: string | null;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  feeAmount: number | null;
  stipendAmount: number | null;
  workNature: WorkNature | "";
  projectTitle: string | null;
  workSummary: string;
  technologies: string[];
  skillsBefore: string[];
  skillsAfter: string[];
  hadMentor: boolean | null;
  mentorFrequency: MentorFrequency | null;
  applicationSource: ApplicationSource | null;
  applicationProcess: string | null;
  beginnerFriendly: boolean | null;
  suitsWhom: string | null;
  certificateEvidenceId: string | null;
};

export type ExperienceFormDefaults = {
  domain: string;
  workMode: WorkMode | "";
  location: string;
  startDate: string;
  endDate: string;
  durationWeeks: string;
  feeAmount: string;
  stipendAmount: string;
  workNature: WorkNature | "";
  projectTitle: string;
  workSummary: string;
  technologies: string[];
  skillsBefore: string[];
  skillsAfter: string[];
  hadMentor: "" | "true" | "false";
  mentorFrequency: string;
  applicationSource: string;
  applicationProcess: string;
  beginnerFriendly: "" | "true" | "false";
  suitsWhom: string;
  certificateEvidenceId: string;
};

export function parseExperienceFormData(formData: FormData): ExperienceFormValues {
  const domain = formString(formData.get("domain"));
  const workModeRaw = formString(formData.get("workMode"));
  const locationRaw = formString(formData.get("location"));
  const startDate = formString(formData.get("startDate"));
  const endDate = formString(formData.get("endDate"));
  const durationRaw = formString(formData.get("durationWeeks"));
  const workNatureRaw = formString(formData.get("workNature"));
  const projectTitleRaw = formString(formData.get("projectTitle"));
  const workSummary = formString(formData.get("workSummary"));
  const hadMentorRaw = formString(formData.get("hadMentor"));
  const mentorFrequencyRaw = formString(formData.get("mentorFrequency"));
  const applicationSourceRaw = formString(formData.get("applicationSource"));
  const applicationProcessRaw = formString(formData.get("applicationProcess"));
  const beginnerFriendlyRaw = formString(formData.get("beginnerFriendly"));
  const suitsWhomRaw = formString(formData.get("suitsWhom"));
  const certificateEvidenceIdRaw = formString(formData.get("certificateEvidenceId"));

  const durationWeeks = durationRaw ? Number(durationRaw) : Number.NaN;
  const feeAmount = parseOptionalAmount(formData.get("feeAmount"));
  const stipendAmount = parseOptionalAmount(formData.get("stipendAmount"));

  return {
    domain,
    workMode: WORK_MODE_VALUES.has(workModeRaw) ? (workModeRaw as WorkMode) : "",
    location: locationRaw ? locationRaw : null,
    startDate,
    endDate,
    durationWeeks,
    feeAmount,
    stipendAmount,
    workNature: WORK_NATURE_VALUES.has(workNatureRaw)
      ? (workNatureRaw as WorkNature)
      : "",
    projectTitle: projectTitleRaw ? projectTitleRaw : null,
    workSummary,
    technologies: parseTagList(formData.get("technologies")),
    skillsBefore: parseTagList(formData.get("skillsBefore")),
    skillsAfter: parseTagList(formData.get("skillsAfter")),
    hadMentor: hadMentorRaw ? parseBooleanChoice(hadMentorRaw) : null,
    mentorFrequency: MENTOR_FREQUENCY_VALUES.has(mentorFrequencyRaw)
      ? (mentorFrequencyRaw as MentorFrequency)
      : null,
    applicationSource: SOURCE_VALUES.has(applicationSourceRaw)
      ? (applicationSourceRaw as ApplicationSource)
      : null,
    applicationProcess: applicationProcessRaw ? applicationProcessRaw : null,
    beginnerFriendly: beginnerFriendlyRaw ? parseBooleanChoice(beginnerFriendlyRaw) : null,
    suitsWhom: suitsWhomRaw ? suitsWhomRaw : null,
    certificateEvidenceId: certificateEvidenceIdRaw ? certificateEvidenceIdRaw : null,
  };
}

function validateDates(
  values: ExperienceFormValues,
  errors: Record<string, string>,
  requireAll: boolean,
) {
  if (requireAll && !values.startDate) errors.startDate = "Enter a start date.";
  if (requireAll && !values.endDate) errors.endDate = "Enter an end date.";
  if (values.startDate && values.endDate) {
    const start = new Date(values.startDate);
    const end = new Date(values.endDate);
    if (Number.isNaN(start.getTime())) errors.startDate = "Enter a valid start date.";
    if (Number.isNaN(end.getTime())) errors.endDate = "Enter a valid end date.";
    if (!errors.startDate && !errors.endDate && end <= start) {
      errors.endDate = "End date must be after the start date.";
    }
  }
}

function validateDuration(
  values: ExperienceFormValues,
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

function validateMoney(values: ExperienceFormValues, errors: Record<string, string>) {
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

export function validateExperienceDraft(
  values: ExperienceFormValues,
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (values.domain && !DOMAIN_VALUES.has(values.domain)) {
    errors.domain = "Choose a valid domain.";
  }
  if (values.workMode && !WORK_MODE_VALUES.has(values.workMode)) {
    errors.workMode = "Choose a valid work mode.";
  }
  if (values.workNature && !WORK_NATURE_VALUES.has(values.workNature)) {
    errors.workNature = "Choose a valid work nature.";
  }
  if (values.workSummary && values.workSummary.length < MIN_WORK_SUMMARY_DRAFT) {
    errors.workSummary = `Add at least ${MIN_WORK_SUMMARY_DRAFT} characters describing your work.`;
  }
  if (
    values.applicationProcess &&
    values.applicationProcess.length < MIN_APPLICATION_PROCESS_DRAFT
  ) {
    errors.applicationProcess = `Add at least ${MIN_APPLICATION_PROCESS_DRAFT} characters.`;
  }
  if (values.suitsWhom && values.suitsWhom.length < MIN_SUITS_WHOM_DRAFT) {
    errors.suitsWhom = `Add at least ${MIN_SUITS_WHOM_DRAFT} characters.`;
  }

  validateDates(values, errors, false);
  validateDuration(values, errors, false);
  validateMoney(values, errors);

  return Object.keys(errors).length > 0 ? errors : null;
}

export function validateExperienceSubmit(
  values: ExperienceFormValues,
): Record<string, string> | null {
  const errors: Record<string, string> = {};

  if (!values.domain) errors.domain = "Choose a domain.";
  else if (!DOMAIN_VALUES.has(values.domain)) errors.domain = "Choose a valid domain.";

  if (!values.workMode) errors.workMode = "Choose a work mode.";
  if (
    (values.workMode === "onsite" || values.workMode === "hybrid") &&
    !values.location?.trim()
  ) {
    errors.location = "Enter the internship location.";
  }

  validateDates(values, errors, true);
  validateDuration(values, errors, true);
  validateMoney(values, errors);

  if (!values.workNature) errors.workNature = "Choose the type of work you did.";
  if (!values.workSummary) {
    errors.workSummary = "Describe what you actually worked on.";
  } else if (values.workSummary.length < MIN_WORK_SUMMARY_SUBMIT) {
    errors.workSummary = `Describe your work in at least ${MIN_WORK_SUMMARY_SUBMIT} characters.`;
  }

  if (values.workNature && values.workNature !== "training_only" && !values.projectTitle?.trim()) {
    errors.projectTitle = "Enter the project or focus area you worked on.";
  }

  if (values.technologies.length < MIN_TAG_COUNT_SUBMIT) {
    errors.technologies = "Add at least one technology you used.";
  }
  if (values.skillsAfter.length < MIN_TAG_COUNT_SUBMIT) {
    errors.skillsAfter = "Add at least one skill you gained.";
  }

  if (values.hadMentor === null) {
    errors.hadMentor = "Tell us whether a mentor was available.";
  } else if (values.hadMentor && !values.mentorFrequency) {
    errors.mentorFrequency = "Choose how often you interacted with your mentor.";
  }

  if (!values.applicationSource) {
    errors.applicationSource = "Choose how you obtained this internship.";
  }
  if (!values.applicationProcess) {
    errors.applicationProcess = "Describe how you applied and secured the internship.";
  } else if (values.applicationProcess.length < MIN_APPLICATION_PROCESS_SUBMIT) {
    errors.applicationProcess = `Describe the application pathway in at least ${MIN_APPLICATION_PROCESS_SUBMIT} characters.`;
  }

  if (values.beginnerFriendly === null) {
    errors.beginnerFriendly = "Indicate whether this internship suits beginners.";
  }
  if (!values.suitsWhom) {
    errors.suitsWhom = "Explain who would benefit from this internship.";
  } else if (values.suitsWhom.length < MIN_SUITS_WHOM_SUBMIT) {
    errors.suitsWhom = `Write at least ${MIN_SUITS_WHOM_SUBMIT} characters of guidance for future students.`;
  }

  if (!values.certificateEvidenceId) {
    errors.certificate = "Attach your internship certificate before submitting.";
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

export function toExperienceInput(values: ExperienceFormValues): Record<string, unknown> {
  return {
    domain: values.domain,
    workMode: values.workMode,
    location: values.location,
    startDate: values.startDate,
    endDate: values.endDate,
    durationWeeks: values.durationWeeks,
    feeAmount: values.feeAmount,
    stipendAmount: values.stipendAmount,
    workNature: values.workNature,
    projectTitle: values.projectTitle,
    workSummary: values.workSummary,
    technologies: values.technologies,
    skillsBefore: values.skillsBefore,
    skillsAfter: values.skillsAfter,
    hadMentor: values.hadMentor,
    mentorFrequency: values.hadMentor ? values.mentorFrequency : null,
    applicationSource: values.applicationSource,
    applicationProcess: values.applicationProcess,
    beginnerFriendly: values.beginnerFriendly,
    suitsWhom: values.suitsWhom,
    certificateEvidenceId: values.certificateEvidenceId,
  };
}

export function experienceToFormDefaults(experience: ExperienceDetail): ExperienceFormDefaults {
  return {
    domain: experience.domain,
    workMode: experience.workMode,
    location: experience.location ?? "",
    startDate: experience.startDate,
    endDate: experience.endDate,
    durationWeeks:
      experience.durationWeeks > 0 ? String(experience.durationWeeks) : "",
    feeAmount: experience.feeAmount === null ? "" : String(experience.feeAmount),
    stipendAmount:
      experience.stipendAmount === null ? "" : String(experience.stipendAmount),
    workNature: experience.workNature,
    projectTitle: experience.projectTitle ?? "",
    workSummary: experience.workSummary,
    technologies: experience.technologies,
    skillsBefore: experience.skillsBefore,
    skillsAfter: experience.skillsAfter,
    hadMentor:
      experience.hadMentor === true
        ? "true"
        : experience.hadMentor === false
          ? "false"
          : "",
    mentorFrequency: experience.mentorFrequency ?? "",
    applicationSource: experience.applicationSource ?? "",
    applicationProcess: experience.applicationProcess ?? "",
    beginnerFriendly:
      experience.beginnerFriendly === true
        ? "true"
        : experience.beginnerFriendly === false
          ? "false"
          : "",
    suitsWhom: experience.suitsWhom ?? "",
    certificateEvidenceId: experience.certificate?.id ?? "",
  };
}

export function latestFacultyChanges(
  entries: ExperienceDetail["timeline"],
  fallbackReason: string | null,
): string | null {
  const requests = entries.filter(
    (entry) => entry.action === "request_changes" && entry.actorRole === "faculty",
  );
  const latest = requests.at(-1);
  return latest?.reason?.trim() || fallbackReason?.trim() || null;
}
