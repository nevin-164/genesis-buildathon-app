"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createUser,
  setUserActive,
  resetUserPassword,
} from "@/controllers/admin/user.controller";
import { toActionState, type ActionState } from "@/lib/api/action-state";

export async function createUserAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
    const rawData = Object.fromEntries(formData);
    await createUser(rawData);
  } catch (error) {
    return toActionState(error);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users");
}

/*
 * TODO / DEPENDENCY NOTE FOR PACKAGE 3:
 * Updating user profile fields (fullName, email, registerNumber, classId) on edit
 * is pending Package 3 exporting `updateUser({ userId, fullName, email, registerNumber, classId })`.
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
    // Placeholder until Package 3 exports updateUser
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
    return { ok: true, message: "User profile update pending Package 3 updateUser export." };
  } catch (error) {
    return toActionState(error);
  }
}

export async function setUserActiveAction(
  userId: string,
  isActive: boolean
): Promise<ActionState> {
  try {
    await setUserActive(userId, isActive);
    revalidatePath(`/admin/users/${userId}`);
    revalidatePath("/admin/users");
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
