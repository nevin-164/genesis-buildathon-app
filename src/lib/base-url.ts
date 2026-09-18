/**
 * Where this deployment lives, as an absolute origin with no trailing slash.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * NO `server-only` HERE. `lib/auth/oauth.ts` is a server module, but this file
 * holds nothing secret and nothing heavy, and marking it would only make it
 * awkward to reuse.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Two things need it, and both are broken in a way nobody notices until a real
 * user hits them:
 *
 *   - the verification link in an email, which is dead if it says localhost
 *   - the OAuth redirect URI, which Google compares byte for byte
 *
 * Before this, both fell back to `http://localhost:3000`. On a deployed box
 * that fallback is never right and never loud: registration still succeeds,
 * the mail still sends, and the link in it points at the recipient's own
 * machine. So the Vercel-provided origins sit in front of the fallback.
 */

/** `https://` + host, with any trailing slash trimmed. Blank input stays blank. */
function normalise(value: string | undefined): string {
  if (!value) return "";
  const withScheme = /^https?:\/\//.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
}

/**
 * First match wins:
 *
 *   1. `APP_BASE_URL` — set it and nothing below is consulted. A custom domain
 *      has to come from here; Vercel does not report which of a project's
 *      domains is the canonical one.
 *   2. `OAUTH_REDIRECT_BASE_URL` — `.env.example` says the two carry the same
 *      value, and this one cannot be left blank without Google sign-in
 *      breaking loudly, so it is the better guess of the pair.
 *   3. Vercel's own. `VERCEL_PROJECT_PRODUCTION_URL` in production;
 *      `VERCEL_URL`, the per-deployment hostname, on a preview. A preview must
 *      NOT borrow the production URL — a verification link generated on a
 *      branch deploy would then hand the tester a token on production.
 *   4. localhost, which is correct for `next dev` and for nothing else.
 */
export function baseUrl(): string {
  const explicit = normalise(process.env.APP_BASE_URL || process.env.OAUTH_REDIRECT_BASE_URL);
  if (explicit) return explicit;

  const vercel =
    process.env.VERCEL_ENV === "production"
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : process.env.VERCEL_URL;

  return normalise(vercel) || "http://localhost:3000";
}

/**
 * True when the origin above is a real guess rather than the localhost
 * fallback. Callers that send something outward — mail, an OAuth handshake —
 * use it to decide whether to complain.
 */
export function hasConfiguredBaseUrl(): boolean {
  return baseUrl() !== "http://localhost:3000";
}
