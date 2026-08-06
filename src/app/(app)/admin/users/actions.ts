"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createUser,
  setUserActive,
  resetUserPassword,
  updateUser,
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
