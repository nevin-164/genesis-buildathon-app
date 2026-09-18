"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/dal";
import { hashToken } from "@/lib/auth/refresh";
import { HOME_FOR_ROLE } from "@/lib/constants/roles";
import { checkRateLimit } from "@/lib/rate-limit";
import * as EmailTokenModel from "@/models/email-token.model";
import { UserModel } from "@/models/user.model";
import { sendVerificationEmail } from "@/services/email.service";
import type { ActionState } from "@/types/contracts";

export async function confirmEmailAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const token = String(formData.get("token") ?? "");
  if (!token) {
    return { ok: false, message: "That link is not valid." };
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

  const user = await UserModel.findById(row.userId);
  const destination = user ? HOME_FOR_ROLE[user.role] : "/student";

  redirect(destination);
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

  const gate = await checkRateLimit({
    key: `verify-resend:user:${user.id}`,
    limit: 3,
    windowSeconds: 3600,
  });

  if (!gate.ok) {
    return { ok: false, message: "Please wait before requesting another email." };
  }

  const sent = await sendVerificationEmail({
    userId: user.id,
    to: user.email,
    fullName: user.fullName,
  });

  if (!sent) {
    return {
      ok: true,
      message: "Verification email generated (check server console if Mailgun is unconfigured).",
    };
  }

  return { ok: true, message: "A new verification email has been sent. Please check your inbox." };
}
