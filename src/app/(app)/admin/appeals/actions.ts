"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { decideAppeal } from "@/controllers/appeal.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

/**
 * Both rulings come through here — the button that was pressed carries its own
 * `decision` value, so one action serves the whole form.
 */
export async function decideAppealAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const id = String(formData.get("internshipId") ?? "");

  try {
    await decideAppeal(id, {
      decision: formData.get("decision"),
      reason: formData.get("reason"),
      confirmEvidence: formData.get("confirmEvidence"),
      confirmAdvisorConsidered: formData.get("confirmAdvisorConsidered"),
    });
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/admin/appeals");
  revalidatePath("/admin");
  /*
   * The student's screens and the advisor's both change: an overturned appeal
   * publishes a card, an upheld one closes the file. Neither would notice
   * otherwise, because both pages are rendered from the same cached routes.
   */
  revalidatePath(`/student/internships/${id}`);
  revalidatePath("/faculty");
  revalidatePath("/student/explore");

  redirect("/admin/appeals");
}
