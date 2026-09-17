"use server";

import { revalidatePath } from "next/cache";
import {
  setUserActive,
  resetUserPassword,
  updateUser,
} from "@/controllers/admin/user.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

/**
 * No create action. Students and faculty register themselves at /register, so
 * the only account an admin could make is one whose password they would then
 * have to deliver by hand.
 */

/**
 * Name, email, and for a student their register number and class.
 *
 * Role is not sent through here. The form renders it as fixed text on edit, and
 * the controller ignores it either way — a student with internships must not
 * become the faculty member reviewing them.
 */
export async function updateUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = (formData.get("userId") as string)?.trim();
    if (!userId) {
      return { ok: false, message: "User ID is required." };
    }

    await updateUser(userId, Object.fromEntries(formData));

    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    return { ok: true, message: "Changes saved." };
  } catch (error) {
    return toActionState(error);
  }
}

/**
 * Deactivating a faculty member who still advises a class comes back here as an
 * InvalidStateError telling the admin to hand the classes over first. That is
 * the guard which keeps every class pointing at an account that can sign in.
 */
export async function setUserActiveAction(
  userId: string,
  isActive: boolean
): Promise<ActionState> {
  try {
    await setUserActive(userId, isActive);
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return {
      ok: true,
      message: `User account ${isActive ? "activated" : "deactivated"}.`,
    };
  } catch (error) {
    return toActionState(error);
  }
}

export async function resetUserPasswordAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const userId = (formData.get("userId") as string)?.trim();
    const newPassword = (formData.get("newPassword") as string)?.trim();

    if (!userId || !newPassword || newPassword.length < 8) {
      return {
        ok: false,
        message: "Password must be at least 8 characters long.",
        fieldErrors: { newPassword: "At least 8 characters required." },
      };
    }

    await resetUserPassword(userId, newPassword);
    revalidatePath(`/admin/users/${userId}`);
    return { ok: true, message: "Password reset successfully." };
  } catch (error) {
    return toActionState(error);
  }
}
