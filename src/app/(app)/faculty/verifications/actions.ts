"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifyInternship } from "@/controllers/verification.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

/**
 * The three verifier decisions all come through here — the button that was
 * pressed carries its own `action` value, so one action serves the whole form.
 */
export async function verifyInternshipAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get("internshipId") ?? "");

  try {
    await verifyInternship(id, {
      action: formData.get("action"),
      reason: formData.get("reason"),
      confirmIdentity: formData.get("confirmIdentity"),
      confirmEvidence: formData.get("confirmEvidence"),
      confirmNoPrivateInfo: formData.get("confirmNoPrivateInfo"),
    });
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/faculty/verifications");
  revalidatePath("/faculty");
  redirect("/faculty/verifications");
}
