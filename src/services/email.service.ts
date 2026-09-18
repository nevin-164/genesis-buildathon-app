import "server-only";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SEAM FILE — owner: package C (email verification).
 *
 * `sendVerificationEmail` is already called from the end of `registerAction`.
 * Package C replaces the body; `register/actions.ts` does not change.
 *
 * Nobody outside package C edits this file.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * This is the only file that may import `mailgun.js`, the same way
 * `storage.service.ts` is the only file that may import the Supabase client.
 */

/**
 * What the caller knows. Note what is NOT here: the token.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * Minting the token, storing its hash and building the URL all happen INSIDE
 * this service. If the caller passed a URL, package C would have to reopen
 * `register/actions.ts` to mint the token there — which is the exact merge
 * conflict this seam exists to prevent. The caller supplies identity; the
 * service owns the secret.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export type VerificationEmail = {
  userId: string;
  to: string;
  fullName: string;
};

/**
 * Both halves, or nothing. A key without a domain cannot send, and Mailgun
 * reports the resulting failure as a 401 that reads exactly like a bad key —
 * so check them together and fail into the console-log branch instead.
 */
export function isMailgunConfigured(): boolean {
  return Boolean(process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN);
}

/** `<APP_BASE_URL>/verify?token=…`, absolute — a relative link in an email is dead. */
export function verifyUrl(token: string): string {
  const base = (process.env.APP_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
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
 *
 * Returns whether it went out, so the caller can decide what to tell them. It
 * is not currently used — registration says the same thing either way, and the
 * "resend" button on /verify is the real recovery path.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * With MAILGUN_API_KEY or MAILGUN_DOMAIN blank, package C logs the link to the
 * server console instead of sending. That is what lets the rest of the team run
 * registration locally without a Mailgun account, so keep that branch when you
 * fill this in.
 */
export async function sendVerificationEmail(email: VerificationEmail): Promise<boolean> {
  /*
   * Package C replaces this with:
   *
   *   const token = newOpaqueToken();                       // lib/auth/refresh.ts
   *   await EmailTokenModel.create({
   *     userId: email.userId,
   *     tokenHash: await hashToken(token),                  // lib/auth/refresh.ts
   *     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
   *   });
   *   const url = verifyUrl(token);
   *   if (!isMailgunConfigured()) { console.info(url); return false; }
   *
   *   const mg = new Mailgun(formData).client({
   *     username: "api",
   *     key: process.env.MAILGUN_API_KEY!,
   *     url: process.env.MAILGUN_API_BASE || "https://api.mailgun.net",
   *   });
   *   try {
   *     await mg.messages.create(process.env.MAILGUN_DOMAIN!, {
   *       from: process.env.EMAIL_FROM!, to: [email.to], subject: …, text: …, html: …,
   *     });
   *     return true;
   *   } catch (error) { console.error("[email.service]", error); return false; }
   *
   * Note the try/catch around the send and NOT around the token insert: a token
   * that was never stored is a link that can never work, and that should be
   * loud. A send that failed is recoverable from /verify.
   *
   * `mg.messages.create` THROWS on an API error — it does not return an error
   * object — so the try/catch is the whole error path, not a backstop.
   */
  console.info(
    `[email.service] stub — no mail sent, no token minted, for ${email.to} (${email.userId}).`,
  );
  return false;
}
