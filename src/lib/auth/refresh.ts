import "server-only";

import { AuthSessionModel } from "@/models/auth-session.model";
import type { User } from "@/db/schema/users";

import { signAccessToken } from "./jwt";

const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * SHA-256, hex. Web Crypto rather than `node:crypto` so the same function works
 * in the proxy and in a Server Action without two implementations drifting.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return toHex(new Uint8Array(digest));
}

/** 32 random bytes. Opaque: it carries nothing, the `auth_sessions` row does. */
export function newOpaqueToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Opens a new session family and returns the pair of cookie values for it.
 *
 * Login and register both need exactly this. Rotation of an existing family is
 * a different problem and lives in `src/proxy.ts`, because only the proxy can
 * put the replacement cookies onto the request that is already in flight.
 */
export async function issueSession(
  user: Pick<User, "id" | "role" | "sessionVersion">,
): Promise<{ accessToken: string; refreshToken: string }> {
  const refreshToken = newOpaqueToken();

  const session = await AuthSessionModel.createSession({
    userId: user.id,
    familyId: crypto.randomUUID(),
    tokenHash: await hashToken(refreshToken),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    sv: user.sessionVersion,
    sid: session.familyId,
  });

  return { accessToken, refreshToken };
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
