"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { toActionState } from "@/lib/api/action-state";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/cookies";
import { ValidationError } from "@/lib/auth/errors";
import { hashPassword } from "@/lib/auth/password";
import { issueSession } from "@/lib/auth/refresh";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { UserModel } from "@/models/user.model";
import type { ActionState } from "@/types/contracts";

import { fieldErrorsFrom } from "../field-errors";

/** Students only. Faculty and admin accounts are created from the admin area. */
const registerSchema = z.object({
  fullName: z.string().trim().min(1, { message: "Enter your full name." }),
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(6, { message: "Use at least 6 characters." }),
  registerNumber: z.string().trim().min(1, { message: "Enter your register number." }),
  classId: z.uuid({ message: "Choose your class." }),
});

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination: string;

  try {
    const parsed = registerSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      registerNumber: formData.get("registerNumber"),
      classId: formData.get("classId"),
    });
    if (!parsed.success) throw new ValidationError(fieldErrorsFrom(parsed.error));

    const { fullName, email, password, registerNumber, classId } = parsed.data;

    // No pre-flight "is this email taken" query. Two people registering at once
    // would both pass it; the unique index is the only check that cannot race,
    // so let it fire and translate the error below.
    const user = await UserModel.createStudent(
      { email, passwordHash: await hashPassword(password), fullName },
      { registerNumber, classId },
    );

    await UserModel.updateLastLogin(user.id);

    const { accessToken, refreshToken } = await issueSession(user);
    const jar = await cookies();
    jar.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    jar.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    destination = HOME_FOR_ROLE[user.role];
  } catch (error) {
    const conflict = uniqueViolation(error);

    if (conflict?.includes("email")) {
      return {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors: { email: "An account with this email already exists." },
      };
    }
    if (conflict?.includes("register_number")) {
      return {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors: { registerNumber: "This register number is already registered." },
      };
    }

    return toActionState(error);
  }

  // Outside the try: redirect() works by throwing, and the catch above would
  // treat a successful registration as a failure.
  redirect(destination);
}

/**
 * Postgres 23505 is a unique violation. Returns the constraint name (or the
 * next best identifying text) lower-cased, so the caller can tell which index
 * was hit — `users_email_key` or `student_profiles_register_number_key`.
 *
 * Drizzle wraps driver errors, so the PostgresError carrying the constraint is
 * on `cause`, not on the error it hands back. Walk the chain rather than
 * trusting the top-level object.
 */
function uniqueViolation(error: unknown): string | null {
  let current: unknown = error;

  for (let depth = 0; depth < 5; depth++) {
    if (typeof current !== "object" || current === null) return null;

    const candidate = current as {
      code?: unknown;
      constraint_name?: unknown;
      detail?: unknown;
      cause?: unknown;
    };

    if (candidate.code === "23505") {
      return String(candidate.constraint_name ?? candidate.detail ?? "").toLowerCase();
    }

    current = candidate.cause;
  }

  return null;
}
