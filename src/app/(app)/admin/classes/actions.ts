"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClass } from "@/controllers/admin/org.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

/**
 * All three fields are required. The advisor especially: it is what routes
 * every future submission from this class, and `classSchema` plus the NOT NULL
 * column both refuse a blank one.
 */
export async function createClassAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    await createClass({
      batchId: (formData.get("batchId") as string)?.trim(),
      name: (formData.get("name") as string)?.trim(),
      advisorId: (formData.get("advisorId") as string)?.trim(),
    });
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/admin/classes");
  revalidatePath("/admin");
  redirect("/admin/classes");
}
