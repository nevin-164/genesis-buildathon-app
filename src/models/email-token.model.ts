import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { emailVerificationTokens } from "@/db/schema/email-tokens";
import type { EmailVerificationToken } from "@/db/schema/email-tokens";

export async function create(data: {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}): Promise<EmailVerificationToken> {
  const [row] = await db.insert(emailVerificationTokens).values(data).returning();
  return row;
}

/**
 * Returns the row whatever state it is in — consumed and expired included.
 *
 * Deliberate: /verify tells "this link was already used" apart from "this link
 * has expired", and it can only do that if it is handed the row and left to
 * read the two timestamps itself. Filtering here would collapse both into one
 * indistinguishable miss.
 */
export async function findByHash(
  tokenHash: string,
): Promise<EmailVerificationToken | null> {
  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.tokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

/**
 * Stamps consumed_at, and ONLY if it is still null. Zero rows back means
 * somebody already used it — that is the lock, and it is what makes a
 * double-clicked link safe.
 */
export async function consume(id: string): Promise<boolean> {
  const [row] = await db
    .update(emailVerificationTokens)
    .set({ consumedAt: new Date() })
    .where(
      and(
        eq(emailVerificationTokens.id, id),
        isNull(emailVerificationTokens.consumedAt),
      ),
    )
    .returning({ id: emailVerificationTokens.id });
  return Boolean(row);
}

/** Most recent token for a user — "resend" reads this to decide about throttling. */
export async function findLatestForUser(userId: string) {
  const [row] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.userId, userId))
    .orderBy(desc(emailVerificationTokens.createdAt))
    .limit(1);
  return row ?? null;
}
