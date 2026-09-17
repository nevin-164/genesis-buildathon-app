"use server";

import { revalidatePath } from "next/cache";

import {
  addStudentToClass,
  moveStudentBetweenClasses,
  updateClassAdvisor,
} from "@/controllers/admin/org.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

/**
 * Everything on this screen is preventive: it decides where *future*
 * internships go. Not one of these actions touches an internship row.
 */

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

/** Revalidate the class, the directory, and the dashboard counts behind them. */
function revalidateClass(classId: string): void {
  revalidatePath(`/admin/classes/${classId}`);
  revalidatePath("/admin/classes");
  revalidatePath("/admin/users");
}

export async function updateAdvisorAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classId = field(formData, "classId");

  try {
    if (!classId) return { ok: false, message: "Class ID is missing." };

    await updateClassAdvisor(classId, field(formData, "advisorId"));
  } catch (error) {
    return toActionState(error);
  }

  revalidateClass(classId);
  return {
    ok: true,
    message: "Advisor updated. New submissions go to them; anything already submitted does not.",
  };
}

/** Pull a student in from another class. */
export async function addStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classId = field(formData, "classId");

  try {
    const studentId = field(formData, "studentId");
    if (!classId) return { ok: false, message: "Class ID is missing." };
    if (!studentId) {
      return {
        ok: false,
        message: "Pick a student to move into this class.",
        fieldErrors: { studentId: "Please select a student." },
      };
    }

    await addStudentToClass(classId, studentId);
  } catch (error) {
    return toActionState(error);
  }

  revalidateClass(classId);
  return { ok: true, message: "Student moved into this class." };
}

/**
 * Send a student to a different class.
 *
 * There is no "remove" — a class is mandatory, so leaving one always means
 * joining another.
 */
export async function moveStudentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const classId = field(formData, "classId");

  try {
    const studentId = field(formData, "studentId");
    const toClassId = field(formData, "toClassId");

    if (!classId || !studentId) {
      return { ok: false, message: "Class ID and student ID are required." };
    }
    if (!toClassId) {
      return {
        ok: false,
        message: "Pick the class to move them to.",
        fieldErrors: { toClassId: "Please select a class." },
      };
    }

    await moveStudentBetweenClasses(classId, studentId, toClassId);
  } catch (error) {
    return toActionState(error);
  }

  revalidateClass(classId);
  return { ok: true, message: "Student moved." };
}
