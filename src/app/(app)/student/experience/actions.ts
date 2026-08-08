"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createExperienceDraft,
  getMyExperience,
  listContributableApplications,
  listMyExperiences,
  saveExperienceDraft,
  submitExperience,
} from "@/controllers/experience.controller";
import { confirmUpload, requestUploadUrl } from "@/controllers/evidence.controller";
import {
  findOpenExperienceDraft,
} from "@/components/experience/experience-workflow";
import {
  parseExperienceFormData,
  toExperienceInput,
  validateExperienceDraft,
  validateExperienceSubmit,
} from "@/components/experience/form-utils";
import { toActionState } from "@/lib/api/action-state";
import type { ActionState, EvidenceRef } from "@/types/contracts";

export async function createExperienceDraftAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const applicationId = formData.get("applicationId");

  if (typeof applicationId !== "string" || !applicationId.trim()) {
    return {
      ok: false,
      message: "Choose an approved internship before starting a report.",
      fieldErrors: { applicationId: "Missing internship." },
    };
  }

  const trimmedApplicationId = applicationId.trim();
  let editExperienceId: string | null = null;

  try {
    const [experiences, contributable] = await Promise.all([
      listMyExperiences(),
      listContributableApplications(),
    ]);

    const openDraft = findOpenExperienceDraft(experiences);
    if (openDraft) {
      editExperienceId = openDraft.id;
    } else {
      const eligible = contributable.some(
        (item) => item.applicationId === trimmedApplicationId,
      );
      if (!eligible) {
        return {
          ok: false,
          message: "This internship is not ready for a report yet.",
        };
      }

      const { id } = await createExperienceDraft(trimmedApplicationId);
      editExperienceId = id;

      revalidatePath("/student/experience");
      revalidatePath("/student");
      revalidatePath(`/student/experience/${id}`);
      revalidatePath(`/student/experience/${id}/edit`);
    }
  } catch (error) {
    return toActionState(error);
  }

  redirect(`/student/experience/${editExperienceId}/edit`);
}

export async function requestCertificateUploadAction(input: {
  experienceId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<{ evidenceId: string; uploadUrl: string }> {
  return requestUploadUrl({
    ownerType: "experience",
    ownerId: input.experienceId,
    filename: input.filename,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
  });
}

export async function confirmCertificateUploadAction(
  evidenceId: string,
): Promise<EvidenceRef> {
  return confirmUpload(evidenceId);
}

export async function saveExperienceAction(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const experienceId = formData.get("experienceId");
  const intent = formData.get("intent");

  if (typeof experienceId !== "string" || !experienceId.trim()) {
    return {
      ok: false,
      message: "Experience report not found.",
      fieldErrors: { experienceId: "Missing experience report." },
    };
  }

  if (intent !== "draft" && intent !== "submit") {
    return { ok: false, message: "Unknown form action." };
  }

  try {
    const experience = await getMyExperience(experienceId);

    if (!experience.canEdit) {
      return { ok: false, message: "This report can no longer be edited." };
    }

    if (intent === "submit" && !experience.canSubmit) {
      return { ok: false, message: "This report cannot be submitted right now." };
    }

    const values = parseExperienceFormData(formData);
    const fieldErrors =
      intent === "submit"
        ? validateExperienceSubmit(values)
        : validateExperienceDraft(values);

    if (fieldErrors) {
      return {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors,
      };
    }

    const input = toExperienceInput(values);

    if (intent === "submit") {
      await submitExperience(experienceId, input);
      revalidateExperiencePaths(experienceId);
      redirect(`/student/experience/${experienceId}`);
    }

    await saveExperienceDraft(experienceId, input);
    revalidateExperiencePaths(experienceId);

    return {
      ok: true,
      message: "Draft saved.",
    };
  } catch (error) {
    return toActionState(error);
  }
}

function revalidateExperiencePaths(experienceId: string) {
  revalidatePath("/student/experience");
  revalidatePath(`/student/experience/${experienceId}`);
  revalidatePath(`/student/experience/${experienceId}/edit`);
  revalidatePath("/student");
  revalidatePath("/student/explore");
  revalidatePath(`/student/explore/${experienceId}`);
}
