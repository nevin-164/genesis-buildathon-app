"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createBatch } from "@/controllers/admin/org.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

export async function createBatchAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const departmentId = (formData.get("departmentId") as string)?.trim();
    const name = (formData.get("name") as string)?.trim();
    const startYearStr = formData.get("startYear") as string;
    const endYearStr = formData.get("endYear") as string;

    if (!departmentId) {
      return {
        ok: false,
        message: "Department selection is required.",
        fieldErrors: { departmentId: "Please select a department." },
      };
    }

    if (!name) {
      return {
        ok: false,
        message: "Batch name is required (e.g. 2022-2026).",
        fieldErrors: { name: "Batch name is required." },
      };
    }

    const startYear = parseInt(startYearStr, 10);
    const endYear = parseInt(endYearStr, 10);

    if (isNaN(startYear) || isNaN(endYear) || startYear >= endYear) {
      return {
        ok: false,
        message: "Invalid year range. Start year must be earlier than end year.",
        fieldErrors: {
          startYear: "Invalid start year.",
          endYear: "Invalid end year.",
        },
      };
    }

    await createBatch({
      departmentId,
      name,
      startYear,
      endYear,
    });
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/admin/batches");
  redirect("/admin/batches");
}
