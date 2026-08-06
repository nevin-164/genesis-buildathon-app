import "server-only";

import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { authSessions, users } from "@/db/schema/users";
import type { AuthSession, User } from "@/db/schema/users";

export interface SessionWithUser {
  session: AuthSession;
  user: User;
}

export const AuthSessionModel = {
  /** Starts a new refresh-token family. One row per issued token. */
  async createSession(data: {
    userId: string;
    familyId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<AuthSession> {
    const [row] = await db.insert(authSessions).values(data).returning();
    return row;
  },

  /**
   * Looks a token up by the SHA-256 of its plaintext, with the owner joined on.
   * The caller still has to check `revokedAt`, `expiresAt` and `user.isActive` —
   * this returns the row, not a verdict.
   */
  async findSessionByTokenHash(tokenHash: string): Promise<SessionWithUser | null> {
    const [row] = await db
      .select({ session: authSessions, user: users })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(eq(authSessions.tokenHash, tokenHash))
      .limit(1);

    return row ?? null;
  },

  /**
   * Consumes a refresh token and issues its successor, in one transaction.
   *
   * `rotated_at IS NULL` in the WHERE clause is the lock. Two concurrent
   * requests can both read an unrotated row; only one may write it. The loser
   * gets null back and falls through to the grace-window path in the proxy
   * instead of minting a second child and orphaning the first.
   *
   * The child inherits the parent's `expiresAt` unchanged. Thirty days is the
   * absolute life of the session, not a window that activity keeps extending.
   */
  async rotateSession(oldSessionId: string, newTokenHash: string): Promise<AuthSession | null> {
    return db.transaction(async (tx) => {
      const [parent] = await tx
        .update(authSessions)
        .set({ rotatedAt: new Date() })
        .where(and(eq(authSessions.id, oldSessionId), isNull(authSessions.rotatedAt)))
        .returning();

      if (!parent) return null;

      const [child] = await tx
        .insert(authSessions)
        .values({
          userId: parent.userId,
          familyId: parent.familyId,
          tokenHash: newTokenHash,
          expiresAt: parent.expiresAt,
        })
        .returning();

      return child;
    });
  },

  /** Reuse detected, or the user signed out. Kills every token in the chain. */
  async revokeFamily(familyId: string): Promise<void> {
    await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessions.familyId, familyId), isNull(authSessions.revokedAt)));
  },

  /** Sign out everywhere. Pair it with `UserModel.incrementSessionVersion`. */
  async revokeUserSessions(userId: string): Promise<void> {
    await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
  },
};
