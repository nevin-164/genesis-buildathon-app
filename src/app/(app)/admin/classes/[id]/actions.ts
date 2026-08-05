"use server";

import { revalidatePath } from "next/cache";
import {
  updateClassAdvisor,
  removeStudentFromClass,
} from "@/controllers/admin/org.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

export async function updateAdvisorAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const classId = (formData.get("classId") as string)?.trim();
    const advisorIdRaw = (formData.get("advisorId") as string)?.trim();
    const advisorId = advisorIdRaw ? advisorIdRaw : null;

    if (!classId) {
      return { ok: false, message: "Class ID is missing." };
    }

    await updateClassAdvisor(classId, advisorId);

    revalidatePath(`/admin/classes/${classId}`);
    revalidatePath("/admin/classes");
    return { ok: true, message: "Advisor assignment updated successfully." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function removeStudentAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const classId = (formData.get("classId") as string)?.trim();
    const studentId = (formData.get("studentId") as string)?.trim();

    if (!classId || !studentId) {
      return { ok: false, message: "Class ID and Student ID are required." };
    }

    await removeStudentFromClass(classId, studentId);

    revalidatePath(`/admin/classes/${classId}`);
    return { ok: true, message: "Student removed from class." };
  } catch (error) {
    return toActionState(error);
  }
}

/*
 * TODO / DEPENDENCY NOTE FOR PACKAGE 3:
 * `addStudentAction` will be enabled once Package 3 exports `addStudentToClass(classId, studentId)`.
 */
