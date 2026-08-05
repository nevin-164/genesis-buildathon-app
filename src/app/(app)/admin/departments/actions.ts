"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createDepartment } from "@/controllers/admin/org.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

export async function createDepartmentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const code = (formData.get("code") as string)?.trim().toUpperCase();
    const name = (formData.get("name") as string)?.trim();

    if (!code || code.length < 2 || code.length > 10) {
      return {
        ok: false,
        message: "Department code must be between 2 and 10 characters.",
        fieldErrors: { code: "Code must be 2-10 characters." },
      };
    }

    if (!name) {
      return {
        ok: false,
        message: "Department name is required.",
        fieldErrors: { name: "Department name is required." },
      };
    }

    await createDepartment({ code, name });
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/admin/departments");
  redirect("/admin/departments");
}
