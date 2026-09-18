import "server-only";

import formData from "form-data";
import Mailgun from "mailgun.js";

import { hashToken, newOpaqueToken } from "@/lib/auth/refresh";
import * as EmailTokenModel from "@/models/email-token.model";

/**
 * The only file that may import `mailgun.js`, the same way
 * `storage.service.ts` is the only file that may import the Supabase client.
 *
 * `sendVerificationEmail` is called from the end of `registerAction` and from
 * the resend button on /verify. Both call sites pass identity only.
 */

/**
 * What the caller knows. Note what is NOT here: the token.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Minting the token, storing its hash and building the URL all happen INSIDE
 * this service. A caller that passed a URL would have to mint the token itself,
 * which puts the secret in two places and the expiry policy in three. The
 * caller supplies identity; the service owns the secret.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type VerificationEmail = {
  userId: string;
  to: string;
  fullName: string;
};

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * All three, or nothing.
 *
 * A key without a domain cannot send, and Mailgun reports that as a 401 that
 * reads exactly like a bad key. A key and a domain without EMAIL_FROM is worse:
 * the request goes out with no `from` at all and comes back 400, which the
 * try/catch below turns into `return false` — so registration completes, no
 * mail is sent, no link is printed, and the only trace is one server log.
 *
 * Checked together so an incomplete block fails into the console-log branch,
 * where the link is at least visible, instead of into silence.
 */
export function isMailgunConfigured(): boolean {
  return Boolean(
    process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN && process.env.EMAIL_FROM,
  );
}

/**
 * `<base>/verify?token=…`, absolute — a relative link in an email is dead.
 *
 * APP_BASE_URL first, then OAUTH_REDIRECT_BASE_URL. `.env.example` says the two
 * carry the same value, and the OAuth one cannot be left blank without Google
 * sign-in breaking loudly at once — whereas a blank APP_BASE_URL breaks nothing
 * until somebody in production opens a link pointing at their own machine.
 */
export function verifyUrl(token: string): string {
  const configured = process.env.APP_BASE_URL || process.env.OAUTH_REDIRECT_BASE_URL;

  if (!configured && isMailgunConfigured()) {
    // Mail is really going out, and every link in it points at localhost.
    console.error(
      "[email.service] APP_BASE_URL is not set. Verification links point at " +
        "http://localhost:3000 and will not work for anyone who receives them.",
    );
  }

  const base = (configured || "http://localhost:3000").replace(/\/$/, "");
  return `${base}/verify?token=${encodeURIComponent(token)}`;
}

/**
 * Mints a token, stores its hash, and sends the link. NEVER throws.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * By the time this is called the user row is committed and the session cookies
 * are about to be written. A throw here would surface to someone whose account
 * was created perfectly well as "registration failed", and they would try
 * again and hit `users_email_key`. Mail delivery is not part of the
 * registration transaction, and it must not behave as if it were.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Returns whether the message actually went out. Registration ignores it and
 * says the same thing either way; the resend action on /verify reads it and
 * pairs it with `isMailgunConfigured()`, because false covers both "nothing is
 * configured here" and "the provider refused it" — and only the second is
 * something to apologise for.
 *
 * With MAILGUN_API_KEY or MAILGUN_DOMAIN blank the link goes to the server
 * console instead of the wire. Blank is the committed default, and that branch
 * is what lets the rest of the team run registration without a Mailgun account.
 */
export async function sendVerificationEmail(email: VerificationEmail): Promise<boolean> {
  // 1. Mint and store. NOT inside a try/catch — a token that was never stored
  // is a link that can never work, and that failure should be loud.
  const token = newOpaqueToken();
  await EmailTokenModel.create({
    userId: email.userId,
    tokenHash: await hashToken(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
  });

  const url = verifyUrl(token);

  // 2. Not configured: log the link so the rest of the team can still register
  // locally. `isMailgunConfigured()` is already in this file. Keep this.
  if (!isMailgunConfigured()) {
    console.info(`[email.service] Mailgun not configured. Verify link: ${url}`);
    return false;
  }

  // 3. Send. THIS is what must never throw out of the function.
  try {
    const mg = new Mailgun(formData).client({
      username: "api",
      key: process.env.MAILGUN_API_KEY!,
      url: process.env.MAILGUN_API_BASE || "https://api.mailgun.net",
    });

    await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
      from: process.env.EMAIL_FROM!,
      to: [email.to],
      subject: "Confirm your InternLens address",
      html: emailTemplate(email.fullName, url),
      text: `Hi ${email.fullName},\n\nConfirm your address:\n${url}\n\nThe link expires in 24 hours.`,
    });
    return true;
  } catch (error) {
    console.error("[email.service]", error);
    return false;
  }
}

function emailTemplate(fullName: string, url: string): string {
  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px;">
  <h2>Confirm your InternLens address</h2>
  <p>Hi ${fullName},</p>
  <p>Please click the link below to confirm your email address:</p>
  <p style="margin: 24px 0;">
    <a href="${url}" style="background-color: #0f1812; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">Confirm my address</a>
  </p>
  <p>Or copy and paste this link into your browser:</p>
  <p><a href="${url}">${url}</a></p>
  <p style="color: #666; font-size: 14px; margin-top: 24px;">The link expires in 24 hours.</p>
</div>`;
}
