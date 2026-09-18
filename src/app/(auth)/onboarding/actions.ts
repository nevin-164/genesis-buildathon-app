"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { toActionState } from "@/lib/api/action-state";
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  accessCookieOptions,
  refreshCookieOptions,
} from "@/lib/auth/cookies";
import { requireUser } from "@/lib/auth/dal";
import { ValidationError } from "@/lib/auth/errors";
import { issueSession } from "@/lib/auth/refresh";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { onboardingSchema } from "@/lib/validators/onboarding.schema";
import { findByUserId } from "@/models/student-profile.model";
import { UserModel } from "@/models/user.model";
import type { ActionState } from "@/types/contracts";

import { fieldErrorsFrom } from "../field-errors";

export async function onboardingAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination: string;

  try {
    const user = await requireUser();
    if (user.role !== "student") {
      return { ok: false, message: "Your profile is already complete." };
    }
    if (await findByUserId(user.id)) {
      return { ok: false, message: "Your profile is already complete." };
    }

    const parsed = onboardingSchema.safeParse({
      role: formData.get("role"),
      registerNumber: formData.get("registerNumber"),
      classId: formData.get("classId"),
    });
    if (!parsed.success) throw new ValidationError(fieldErrorsFrom(parsed.error));

    const updated = await UserModel.completeOAuthOnboarding(user.id, parsed.data);
    if (!updated) throw new Error("onboarding: user disappeared before completion");

    const { accessToken, refreshToken } = await issueSession(updated);
    const jar = await cookies();
    jar.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    jar.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    destination = HOME_FOR_ROLE[updated.role];
  } catch (error) {
    const conflict = uniqueViolation(error);
    if (conflict?.includes("register_number")) {
      return {
        ok: false,
        message: "Please fix the errors below.",
        fieldErrors: { registerNumber: "This register number is already registered." },
      };
    }
    return toActionState(error);
  }

  redirect(destination);
}

function uniqueViolation(error: unknown): string | null {
  let current: unknown = error;

  for (let depth = 0; depth < 5; depth += 1) {
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
