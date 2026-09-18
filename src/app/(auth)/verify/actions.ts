"use server";

import { redirect } from "next/navigation";

import { getSession, requireUser } from "@/lib/auth/dal";
import { hashToken } from "@/lib/auth/refresh";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import * as EmailTokenModel from "@/models/email-token.model";
import { UserModel } from "@/models/user.model";
import { isMailgunConfigured, sendVerificationEmail } from "@/services/email.service";
import type { ActionState } from "@/types/contracts";

/**
 * A fresh link may not be minted more often than this, per account.
 *
 * Enforced from `email_verification_tokens.created_at` rather than from the
 * rate limiter, because `checkRateLimit` fails open when Upstash is not
 * configured — and blank Upstash keys are the committed default. Without this
 * floor the resend button is an unmetered send-mail-to-anyone control on every
 * local and unconfigured deploy.
 */
const RESEND_COOLDOWN_MS = 60_000;

export async function confirmEmailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) {
    return { ok: false, message: "That link is not valid." };
  }

  /*
   * 32 random bytes is not guessable, so this is not what stops a forgery — it
   * stops the lookup itself being hammered, and it is the same shape of bucket
   * `loginAction` puts in front of its own by-credential read.
   */
  const gate = await checkRateLimit({
    key: `verify-confirm:${await clientIp()}`,
    limit: 10,
    windowSeconds: 600,
  });
  if (!gate.ok) {
    return { ok: false, message: "Too many attempts. Please try again shortly." };
  }

  const tokenHash = await hashToken(token);
  const row = await EmailTokenModel.findByHash(tokenHash);

  // Missing token -> generic missing/expired message.
  if (!row) {
    return { ok: false, message: "That link has expired. Request a new one below." };
  }

  // Already used token -> specific already used message.
  if (row.consumedAt) {
    return { ok: false, message: "That link has already been used." };
  }

  // Expired token -> generic missing/expired message.
  if (row.expiresAt.getTime() <= Date.now()) {
    return { ok: false, message: "That link has expired. Request a new one below." };
  }

  // The lock. Zero rows back means another request got there first.
  if (!(await EmailTokenModel.consume(row.id))) {
    return { ok: false, message: "That link has already been used." };
  }

  await UserModel.markEmailVerified(row.userId);

  /*
   * Confirmed — but the link is just as likely to have been opened in a browser
   * with no session, or one signed in as somebody else, as in the tab that
   * registered. Only walk them into the app when the session on this request is
   * actually the account that was just confirmed; every other case goes to
   * /login, which is the one page that can sort it out.
   *
   * `getSession()` reads the user row afresh, so the flag written a line above
   * is already visible to the gate on the page we land on.
   */
  const session = await getSession();
  redirect(session && session.id === row.userId ? HOME_FOR_ROLE[session.role] : "/login");
}

export async function resendVerificationAction(
  _prev: ActionState,
  _formData?: FormData,
): Promise<ActionState> {
  void _prev;
  void _formData;

  let user;
  try {
    user = await requireUser();
  } catch {
    return { ok: false, message: "You must be signed in to request a verification email." };
  }

  // Nothing to send. Minting a token for a confirmed address would leave a live
  // link in an inbox for a day for no reason.
  if (user.emailVerifiedAt) {
    return { ok: true, message: "Your email address is already verified." };
  }

  const gate = await checkRateLimit({
    key: `verify-resend:user:${user.id}`,
    limit: 3,
    windowSeconds: 3600,
  });

  if (!gate.ok) {
    return { ok: false, message: "Please wait before requesting another email." };
  }

  const latest = await EmailTokenModel.findLatestForUser(user.id);
  if (latest) {
    const elapsed = Date.now() - latest.createdAt.getTime();
    if (elapsed < RESEND_COOLDOWN_MS) {
      const seconds = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
      return {
        ok: false,
        message: `Please wait ${seconds} more second${seconds === 1 ? "" : "s"} before requesting another email.`,
      };
    }
  }

  const sent = await sendVerificationEmail({
    userId: user.id,
    to: user.email,
    fullName: user.fullName,
  });

  if (!sent) {
    /*
     * `sendVerificationEmail` returns false for two very different reasons, and
     * the token exists either way. Unconfigured is the committed default and is
     * a success from the developer's point of view — the link is on the server
     * console. A configured provider returning false is a real failure.
     */
    return isMailgunConfigured()
      ? { ok: false, message: "We could not send that email just now. Please try again shortly." }
      : {
          ok: true,
          message: "Mail is not configured on this server. The verification link is in the server console.",
        };
  }

  return { ok: true, message: "A new verification email has been sent. Please check your inbox." };
}
