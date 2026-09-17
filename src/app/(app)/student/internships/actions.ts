"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createCompanyIfMissing, searchCompanies } from "@/controllers/company.controller";
import {
  confirmUpload,
  deleteDocument,
  requestUploadUrl,
} from "@/controllers/document.controller";
import {
  createInternshipDraft,
  respondToVerification,
  saveInternshipDraft,
  submitInternship,
} from "@/controllers/internship.controller";
import { toActionState } from "@/lib/api/action-state";
import { submitSchema } from "@/lib/validators/internship.schema";
import { FORM_ERROR_KEY } from "@/lib/validators/parse";
import type { ActionState, CompanyOption, DocumentRef } from "@/types/contracts";

/**
 * Every Server Action the student write-flow needs.
 *
 * These are public POST endpoints, so not one of them trusts the page that
 * called it — the controllers behind them re-authorise, re-load the row and
 * re-validate. What lives here is the FormData translation and the redirect,
 * which controllers are not allowed to do.
 */

/* ── FormData → controller input ─────────────────────────────────────────── */

/**
 * The form posts strings; the schemas want typed values. Empty is the
 * interesting case and it means three different things:
 *
 *   an enum       → `undefined`, so zod says "Select a domain" rather than
 *                   failing on the empty string
 *   free text     → `null`, which is what the column stores
 *   money         → `null`, which is "not disclosed" — and is NOT 0, because
 *                   0 means the internship was genuinely free
 */
function readInternshipFields(formData: FormData) {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  /** An enum the schema will reject if it is required and missing. */
  const choice = (key: string) => text(key) || undefined;
  const nullableText = (key: string) => text(key) || null;
  /** Comma-separated chips. The schema trims, de-duplicates and caps at 20. */
  const list = (key: string) =>
    text(key)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  /** "" is a real answer here — "I don't know" — and it stores as NULL. */
  const triState = (key: string) => {
    const value = text(key);
    return value === "" ? null : value === "true";
  };

  const hadMentor = text("hadMentor") === "true";

  return {
    roleTitle: text("roleTitle"),
    domain: choice("domain"),
    workMode: choice("workMode"),
    location: nullableText("location"),
    startDate: choice("startDate"),
    endDate: choice("endDate"),
    // "" reaches moneyField as the not-disclosed case; it is not coerced to 0.
    feeAmount: text("feeAmount"),
    stipendAmount: text("stipendAmount"),
    workNature: choice("workNature"),
    projectTitle: nullableText("projectTitle"),
    workSummary: text("workSummary"),
    hadMentor,
    // Answering "no mentor" and leaving a frequency behind would publish a
    // card that contradicts itself.
    mentorFrequency: hadMentor ? nullableText("mentorFrequency") : null,
    skillsBefore: list("skillsBefore"),
    skillsAfter: list("skillsAfter"),
    technologies: list("technologies"),
    applicationSource: nullableText("applicationSource"),
    applicationProcess: nullableText("applicationProcess"),
    beginnerFriendly: triState("beginnerFriendly"),
    suitsWhom: nullableText("suitsWhom"),
  };
}

/**
 * The form collects a company *name*; every schema wants a company *id*.
 *
 * Resolution is find-or-create and case-insensitive, so two students typing
 * "Zoho" and "zoho" land on one row instead of splitting the same employer
 * across Explore. An empty box resolves to `undefined` and the schema reports
 * it as a missing field like any other.
 */
async function resolveCompanyId(formData: FormData): Promise<string | undefined> {
  const name = String(formData.get("companyName") ?? "").trim();
  if (!name) return undefined;

  const company = await createCompanyIfMissing(name);
  return company.id;
}

async function readInternshipInput(formData: FormData) {
  return { ...readInternshipFields(formData), companyId: await resolveCompanyId(formData) };
}

/** The intent lives on the button, so one form serves save and submit. */
function isSubmitIntent(formData: FormData): boolean {
  return String(formData.get("intent") ?? "") === "submit";
}

/**
 * Pre-flight validation, run only on the *new* screen and only when the intent
 * is submit.
 *
 * The controller validates again and is the authority. This copy exists so a
 * form that cannot pass does not leave a half-filled draft row behind it —
 * on the new screen the row does not exist yet, and creating one just to fail
 * would hand the student a stray draft on their dashboard for every typo.
 */
function submitBlockers(input: unknown): ActionState | null {
  const result = submitSchema.safeParse(input);
  if (result.success) return null;

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : FORM_ERROR_KEY;
    if (fieldErrors[key] === undefined) fieldErrors[key] = issue.message;
  }

  return onCompanyBox({ ok: false, message: "Please fix the errors below.", fieldErrors });
}

/**
 * The schemas validate `companyId`; the student types into a box named
 * `companyName`. Without this the "Select a company" message has no field to
 * attach to and the form shows a red banner pointing at nothing.
 */
function onCompanyBox(state: ActionState): ActionState {
  const companyError = state.fieldErrors?.companyId;
  if (!companyError) return state;

  const fieldErrors: Record<string, string> = {
    ...state.fieldErrors,
    companyName: companyError,
  };
  delete fieldErrors.companyId;

  return { ...state, fieldErrors };
}

/** Everything that changes when an internship moves. */
function revalidateInternship(id: string) {
  revalidatePath(`/student/internships/${id}`);
  revalidatePath(`/student/internships/${id}/edit`);
  revalidatePath("/student/internships");
  revalidatePath("/student");
}

/* ── Create ──────────────────────────────────────────────────────────────── */

/**
 * The "Add an internship" screen.
 *
 * Save keeps it a draft and moves the student to the edit screen, because that
 * is the only place documents can be attached — a draft has to exist before a
 * file can point at it.
 */
export async function createInternshipAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const submitting = isSubmitIntent(formData);
  let id: string;

  try {
    const input = await readInternshipInput(formData);

    if (submitting) {
      const blocked = submitBlockers(input);
      if (blocked) return blocked;
    }

    ({ id } = await createInternshipDraft());
    await saveInternshipDraft(id, input);

    if (submitting) await submitInternship(id, input);
  } catch (error) {
    return onCompanyBox(toActionState(error));
  }

  revalidateInternship(id);
  // Outside the try — `redirect()` works by throwing, and catching it here
  // would report a successful save as "something went wrong".
  redirect(submitting ? `/student/internships/${id}` : `/student/internships/${id}/edit`);
}

/* ── Update ──────────────────────────────────────────────────────────────── */

/** The "Edit internship" screen. Same form, same two intents. */
export async function updateInternshipAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("internshipId") ?? "");
  if (!id) return { ok: false, message: "That internship no longer exists." };

  const submitting = isSubmitIntent(formData);

  try {
    const input = await readInternshipInput(formData);

    // The row already exists, so there is no orphan to avoid — save first so
    // the student's typing survives even when the submit is refused.
    await saveInternshipDraft(id, input);
    if (submitting) await submitInternship(id, input);
  } catch (error) {
    return onCompanyBox(toActionState(error));
  }

  revalidateInternship(id);

  if (submitting) redirect(`/student/internships/${id}`);
  return { ok: true, message: "Saved. Your draft is not visible to anyone yet." };
}

/* ── Documents ───────────────────────────────────────────────────────────── */

/**
 * Step 1 of the upload. Returns a signed URL the browser PUTs the bytes to.
 *
 * Files never travel through this function: a serverless body is capped around
 * 4.5 MB and the limit here is 10 MB, so the bytes go straight to Storage.
 */
export async function requestUploadAction(input: {
  internshipId: string;
  docType: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<
  { ok: true; documentId: string; uploadUrl: string } | { ok: false; message: string }
> {
  try {
    const { documentId, uploadUrl } = await requestUploadUrl(input);
    return { ok: true, documentId, uploadUrl };
  } catch (error) {
    const state = toActionState(error);
    return {
      ok: false,
      message: state.fieldErrors
        ? Object.values(state.fieldErrors)[0]
        : (state.message ?? "That file could not be attached."),
    };
  }
}

/**
 * Step 3, and it is not optional: between the signed URL and this call the
 * browser decided what bytes to send. This re-reads the object's real size and
 * type from Storage and deletes it if the rules were broken.
 */
export async function confirmUploadAction(
  documentId: string,
): Promise<{ ok: true; document: DocumentRef } | { ok: false; message: string }> {
  try {
    const document = await confirmUpload(documentId);
    return { ok: true, document };
  } catch (error) {
    const state = toActionState(error);
    return {
      ok: false,
      message: state.fieldErrors
        ? Object.values(state.fieldErrors)[0]
        : (state.message ?? "That file could not be attached."),
    };
  }
}

/**
 * Called directly rather than through a <form action>: the documents panel is
 * rendered inside the internship form, and a nested <form> is invalid HTML —
 * the browser drops the inner one and the remove button submits the whole
 * internship instead.
 */
export async function removeDocumentAction(
  documentId: string,
  internshipId: string,
): Promise<{ ok: boolean; message?: string }> {
  try {
    await deleteDocument(documentId);
  } catch (error) {
    const state = toActionState(error);
    return { ok: false, message: state.message ?? "That file could not be removed." };
  }

  if (internshipId) revalidateInternship(internshipId);
  return { ok: true };
}

/* ── Company picker ──────────────────────────────────────────────────────── */

/** Feeds the suggestions under the company box as the student types. */
export async function searchCompaniesAction(query: string): Promise<CompanyOption[]> {
  try {
    return await searchCompanies(query);
  } catch {
    // A failed lookup must not block typing — the box is free text, and a
    // company nobody has recorded yet is the normal case for a new employer.
    return [];
  }
}

/* ── Replying to a change request ────────────────────────────────────────── */

/**
 * The student's reply when their advisor asked for changes — action 'respond'
 * on the verification thread. It sends the internship back for review.
 */
const MIN_REPLY_LENGTH = 10;

export async function respondToVerificationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const internshipId = formData.get("internshipId");
  const replyMessage = formData.get("replyMessage");

  if (typeof internshipId !== "string" || !internshipId.trim()) {
    return {
      ok: false,
      message: "Internship not found.",
      fieldErrors: { internshipId: "Missing internship." },
    };
  }

  const trimmed = typeof replyMessage === "string" ? replyMessage.trim() : "";
  if (trimmed.length < MIN_REPLY_LENGTH) {
    return {
      ok: false,
      message: "Please fix the errors below.",
      fieldErrors: {
        replyMessage: `Enter at least ${MIN_REPLY_LENGTH} characters.`,
      },
    };
  }

  try {
    await respondToVerification(internshipId, { reason: trimmed });
    revalidateInternship(internshipId);
    return {
      ok: true,
      message: "Your response has been sent to your faculty advisor.",
    };
  } catch (error) {
    return toActionState(error);
  }
}
