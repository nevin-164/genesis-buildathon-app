"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { reviewApplication } from "@/controllers/application-review.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

export async function reviewApplicationAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const id = String(formData.get("applicationId") ?? "");
  try {
    await reviewApplication(id, {
      action: formData.get("action"),
      reason: formData.get("reason"),
    });
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/faculty/applications");
  redirect("/faculty/applications");
}
