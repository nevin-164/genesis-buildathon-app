"use server";

import { revalidatePath } from "next/cache";
import { assignInternshipFaculty } from "@/controllers/admin/assignment.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

export async function assignFacultyAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const internshipId = (formData.get("internshipId") as string)?.trim();
    const facultyId = (formData.get("facultyId") as string)?.trim();

    if (!internshipId) {
      return { ok: false, message: "Internship ID is missing." };
    }

    if (!facultyId) {
      return {
        ok: false,
        message: "Pick a faculty member to assign.",
        fieldErrors: { facultyId: "Please select a faculty member." },
      };
    }

    await assignInternshipFaculty(internshipId, facultyId);

    revalidatePath("/admin/assignments");
    revalidatePath("/admin");
    return { ok: true, message: "Assigned. It is now in that advisor's queue." };
  } catch (error) {
    return toActionState(error);
  }
}
