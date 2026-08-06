"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyExperience } from "@/controllers/experience-verification.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

export async function verifyExperienceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get("experienceId") ?? "");
  try {
    await verifyExperience(id, {
      action: formData.get("action"),
      reason: formData.get("reason"),
      confirmIdentity: formData.get("confirmIdentity") === "on",
      confirmEvidence: formData.get("confirmEvidence") === "on",
      confirmNoPrivateInfo: formData.get("confirmNoPrivateInfo") === "on",
    });
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/faculty/verifications");
  redirect("/faculty/verifications");
}
