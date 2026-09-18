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
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { UserModel } from "@/models/user.model";
import { sendVerificationEmail } from "@/services/email.service";
import type { ActionState } from "@/types/contracts";

import { fieldErrorsFrom } from "../field-errors";

/**
 * Students and faculty both sign themselves up here.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * `role` is a union of two literals, so "admin" is not merely rejected — it is
 * unrepresentable. A hand-crafted POST carrying role=admin fails the parse. The
 * only administrator is the one in the seed; promotion is an out-of-band act.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * A discriminated union rather than one flat object with optional fields: a
 * faculty member has no register number and no class, and a student must have
 * both. Making that a `superRefine` on a shared shape means every reader has to
 * work out which combinations are legal.
 *
 * The order the two roles register in matters, and it falls out of this:
 * faculty need nothing from the org tree, so they can sign up on an empty
 * database. A student needs a class, a class needs an advisor, and an advisor
 * has to be a registered faculty member.
 */
const baseFields = {
  fullName: z.string().trim().min(1, { message: "Enter your full name." }),
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(8, { message: "Use at least 8 characters." }),
};

const registerSchema = z.discriminatedUnion("role", [
  z.object({
    role: z.literal("student"),
    ...baseFields,
    registerNumber: z.string().trim().min(1, { message: "Enter your register number." }),
    // Required, and the whole reason registration needs the org tree: this is
    // what resolves the faculty member who will verify their internships.
    classId: z.uuid({ message: "Choose your class." }),
  }),
  z.object({
    role: z.literal("faculty"),
    ...baseFields,
  }),
]);

export async function registerAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination: string;

  try {
    const parsed = registerSchema.safeParse({
      role: formData.get("role"),
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      password: formData.get("password"),
      registerNumber: formData.get("registerNumber"),
      classId: formData.get("classId"),
    });
    if (!parsed.success) throw new ValidationError(fieldErrorsFrom(parsed.error));

    /*
     * Per IP, not per email: the thing worth stopping here is one machine
     * enumerating register numbers or filling the table, and the email is
     * different on every one of those attempts.
     *
     * Deliberately looser than the login limit. A genuine sign-up that fails
     * validation twice and succeeds on the third try is normal, and a limit
     * that punishes it is a limit that loses real students.
     */
    const gate = await checkRateLimit({
      key: `register:${await clientIp()}`,
      limit: 5,
      windowSeconds: 3600,
    });
    if (!gate.ok) {
      return { ok: false, message: "Too many sign-up attempts. Please try again later." };
    }

    const { fullName, email, password } = parsed.data;
    const passwordHash = await hashPassword(password);

    // No pre-flight "is this email taken" query. Two people registering at once
    // would both pass it; the unique index is the only check that cannot race,
    // so let it fire and translate the error below.
    const user =
      parsed.data.role === "student"
        ? await UserModel.createStudent(
            { email, passwordHash, fullName },
            { registerNumber: parsed.data.registerNumber, classId: parsed.data.classId },
          )
        : await UserModel.createUser({ email, passwordHash, fullName, role: "faculty" });

    await UserModel.updateLastLogin(user.id);

    /*
     * Mail the verification link. Deliberately NOT inside the try's failure
     * path and deliberately unable to throw — see the note on the service.
     *
     * The user row is committed by this point. A mail provider having a bad
     * minute must not present to someone whose account was created perfectly
     * well as "registration failed", because their retry then hits
     * `users_email_key` and tells them the address is already taken.
     *
     * The token is minted inside the service, not here — this call site passes
     * identity only, so package C never has to reopen this file.
     */
    await sendVerificationEmail({
      userId: user.id,
      to: user.email,
      fullName: user.fullName,
    });

    const { accessToken, refreshToken } = await issueSession(user);
    const jar = await cookies();
    jar.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    jar.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    // Sends a new faculty member to /faculty and a new student to /student,
    // with no branch of its own.
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
