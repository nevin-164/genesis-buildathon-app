"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClass } from "@/controllers/admin/org.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

export async function createClassAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const batchId = (formData.get("batchId") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const advisorIdRaw = (formData.get("advisorId") as string)?.trim();
    const advisorId = advisorIdRaw ? advisorIdRaw : undefined;

    if (!batchId) {
      return {
        ok: false,
        message: "Batch selection is required.",
        fieldErrors: { batchId: "Please select a batch." },
      };
    }

    if (!name) {
      return {
        ok: false,
        message: "Class name is required (e.g. S6-CSE-A).",
        fieldErrors: { name: "Class name is required." },
      };
    }

    await createClass({
      batchId,
      name,
      advisorId,
    });
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/admin/classes");
  redirect("/admin/classes");
}
