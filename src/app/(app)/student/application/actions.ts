"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  getMyApplication,
  respondToClarification,
  saveApplicationDraft,
  submitApplication,
} from "@/controllers/application.controller";
import { createCompanyIfMissing, searchCompanies } from "@/controllers/company.controller";
import { confirmUpload, requestUploadUrl } from "@/controllers/evidence.controller";
import {
  parseApplicationFormData,
  toApplicationInput,
  validateApplicationDraft,
  validateApplicationSubmit,
} from "@/components/application/form-utils";
import { toActionState } from "@/lib/api/action-state";
import type { ActionState, CompanyOption, EvidenceRef } from "@/types/contracts";

const MIN_REPLY_LENGTH = 10;

export async function replyToClarificationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const applicationId = formData.get("applicationId");
  const replyMessage = formData.get("replyMessage");

  if (typeof applicationId !== "string" || !applicationId.trim()) {
    return {
      ok: false,
      message: "Application not found.",
      fieldErrors: { applicationId: "Missing application." },
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
    const application = await getMyApplication(applicationId);

    if (application.status !== "clarification_requested") {
      return {
        ok: false,
        message: "This application is not waiting for a response.",
      };
    }

    if (!application.canEdit) {
      return { ok: false, message: "You cannot reply to this clarification right now." };
    }

    await respondToClarification(applicationId, { replyMessage: trimmed });
    revalidatePath(`/student/application/${applicationId}`);
    revalidatePath("/student/application");
    revalidatePath("/student");
    return {
      ok: true,
      message: "Your response has been sent to your faculty advisor.",
    };
  } catch (error) {
    return toActionState(error);
  }
}

export async function searchCompaniesAction(query: string): Promise<CompanyOption[]> {
  return searchCompanies(query);
}

export async function createCompanyIfMissingAction(name: string): Promise<CompanyOption> {
  return createCompanyIfMissing(name);
}

export async function requestOfferLetterUploadAction(input: {
  applicationId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ evidenceId: string; uploadUrl: string }> {
  return requestUploadUrl({
    ownerType: "application",
    ownerId: input.applicationId,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  });
}

export async function confirmOfferLetterUploadAction(
  evidenceId: string,
): Promise<EvidenceRef> {
  return confirmUpload(evidenceId);
}

export async function saveApplicationAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const applicationId = formData.get("applicationId");
  const intent = formData.get("intent");

  if (typeof applicationId !== "string" || !applicationId.trim()) {
    return {
      ok: false,
      message: "Application not found.",
      fieldErrors: { applicationId: "Missing application." },
    };
  }

  if (intent !== "draft" && intent !== "submit") {
    return { ok: false, message: "Unknown form action." };
  }

  let redirectTo: string | null = null;

  try {
    const application = await getMyApplication(applicationId);

    if (!application.canEdit) {
      return { ok: false, message: "This application can no longer be edited." };
    }

    if (intent === "submit" && !application.canSubmit) {
      return { ok: false, message: "This application cannot be submitted right now." };
    }

    const values = parseApplicationFormData(formData);
    const fieldErrors =
      intent === "submit"
        ? validateApplicationSubmit(values)
        : validateApplicationDraft(values);

    if (fieldErrors) {
      return {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors,
      };
    }

    const input = toApplicationInput(values);

    if (intent === "submit") {
      await submitApplication(applicationId, input);
      revalidatePath(`/student/application/${applicationId}`);
      revalidatePath(`/student/application/${applicationId}/edit`);
      revalidatePath("/student/application");
      revalidatePath("/student");
      redirectTo = `/student/application/${applicationId}`;
    } else {
      await saveApplicationDraft(applicationId, input);
      revalidatePath(`/student/application/${applicationId}`);
      revalidatePath(`/student/application/${applicationId}/edit`);
      revalidatePath("/student/application");
      revalidatePath("/student");

      return {
        ok: true,
        message: "Draft saved.",
      };
    }
  } catch (error) {
    return toActionState(error);
  }

  redirect(redirectTo!);
}
