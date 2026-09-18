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
import { comparePassword } from "@/lib/auth/password";
import { issueSession } from "@/lib/auth/refresh";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { UserModel } from "@/models/user.model";
import type { ActionState } from "@/types/contracts";

import { fieldErrorsFrom } from "../field-errors";

const loginSchema = z.object({
  email: z.email({ message: "Enter a valid email address." }),
  password: z.string().min(1, { message: "Enter your password." }),
});

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  let destination: string;

  try {
    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) throw new ValidationError(fieldErrorsFrom(parsed.error));

    /*
     * Throttled before the password is ever checked, so a bad guess costs an
     * attacker a request but costs us no bcrypt round.
     *
     * Keyed on IP *and* email: IP alone lets one attacker behind a shared NAT
     * lock out a whole campus, and email alone lets them do it deliberately to
     * anybody whose address they know.
     *
     * The message says "too many attempts" without naming the account. Saying
     * "this account is locked" confirms the address is registered, which is the
     * oracle the generic failure message below exists to avoid.
     */
    const gate = await checkRateLimit({
      key: `login:${await clientIp()}:${parsed.data.email}`,
      limit: 10,
      windowSeconds: 600,
    });
    if (!gate.ok) {
      return { ok: false, message: "Too many sign-in attempts. Please try again shortly." };
    }

    const user = await UserModel.findByEmail(parsed.data.email);

    // One message for "no such account", "wrong password" and "deactivated".
    // Telling them apart turns this form into an account-existence oracle, and
    // tells a deactivated user exactly what happened to them.
    if (!user || !user.isActive) {
      return { ok: false, message: "Incorrect email or password." };
    }
    // A null hash is a provider-only account — real, but with no password to
    // check. Same message as every other failure: telling them "this account
    // uses Google" names the provider worth phishing, and confirms the address
    // is registered.
    if (!user.passwordHash) {
      return { ok: false, message: "Incorrect email or password." };
    }
    if (!(await comparePassword(parsed.data.password, user.passwordHash))) {
      return { ok: false, message: "Incorrect email or password." };
    }

    await UserModel.updateLastLogin(user.id);

    const { accessToken, refreshToken } = await issueSession(user);
    const jar = await cookies();
    jar.set(ACCESS_COOKIE, accessToken, accessCookieOptions());
    jar.set(REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    destination = HOME_FOR_ROLE[user.role];
  } catch (error) {
    return toActionState(error);
  }

  // Outside the try on purpose. redirect() signals by throwing, so inside it
  // the catch would swallow the navigation and leave the user staring at the
  // login form after a perfectly good sign-in.
  redirect(destination);
}
