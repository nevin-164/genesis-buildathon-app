"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AuthSessionModel } from "@/models/auth-session.model";

import { ACCESS_COOKIE, REFRESH_COOKIE } from "./cookies";
import { verifyAccessToken } from "./jwt";

/**
 * Sign out.
 *
 * Revokes the whole refresh family before clearing the cookies, so a copy of
 * `il_rt` taken off the wire is dead too. The access token is not revocable —
 * it is a signature, not a row — so it stays valid for up to fifteen minutes.
 * Bump `sessionVersion` instead if you need it gone immediately.
 */
export async function signOutAction(): Promise<void> {
  const jar = await cookies();
  const accessToken = jar.get(ACCESS_COOKIE)?.value;

  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    // `sid` is the family id.
    if (payload) await AuthSessionModel.revokeFamily(payload.sid);
  }

  jar.delete(ACCESS_COOKIE);
  jar.delete(REFRESH_COOKIE);

  redirect("/login");
}
