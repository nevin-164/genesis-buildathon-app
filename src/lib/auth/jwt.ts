import "server-only";

import { SignJWT, jwtVerify } from "jose";

import type { Role } from "@/types/contracts";

const secret = process.env.AUTH_JWT_SECRET;
if (!secret) {
  // Fail at import, not at the first login. A missing signing key is a
  // misconfigured deploy, and it should be loud.
  throw new Error("AUTH_JWT_SECRET is not set. Generate one with: openssl rand -base64 32");
}

const key = new TextEncoder().encode(secret);

/**
 * Deliberately no name, email or class. Those change, and a stale token would
 * keep serving the old value for a quarter of an hour. `role` here is a hint
 * for the proxy's coarse redirect — the database row is what decides.
 */
export interface JWTPayload {
  /** users.id */
  sub: string;
  role: Role;
  /** users.session_version — the kill switch. */
  sv: number;
  /** auth_sessions.family_id, i.e. which session this token belongs to. */
  sid: string;
}

const ACCESS_TOKEN_TTL = "15m";

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ role: payload.role, sv: payload.sv, sid: payload.sid })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TOKEN_TTL)
    .sign(key);
}

/** Returns null for anything not currently valid — bad signature, expired, malformed. */
export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, { algorithms: ["HS256"] });

    // A token signed by us but missing a claim is still a token we cannot act
    // on, so treat a wrong shape exactly like a bad signature.
    if (
      typeof payload.sub !== "string" ||
      typeof payload.sv !== "number" ||
      typeof payload.sid !== "string" ||
      (payload.role !== "student" && payload.role !== "faculty" && payload.role !== "admin")
    ) {
      return null;
    }

    return { sub: payload.sub, role: payload.role, sv: payload.sv, sid: payload.sid };
  } catch {
    return null;
  }
}
