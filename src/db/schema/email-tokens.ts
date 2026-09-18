import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { users } from "./users";

/**
 * One row per verification link sent. Single use: `consumed_at` is stamped the
 * first time the link is followed, and a second visit to the same link is a
 * no-op rather than an error.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ONLY THE SHA-256 HASH IS STORED, never the token itself — exactly as
 * `auth_sessions.token_hash` does it. Reuse `hashToken()` and
 * `newOpaqueToken()` from `lib/auth/refresh.ts`; a second hashing scheme in the
 * same codebase is one more thing to get wrong.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Rows are never deleted. A consumed or expired token is evidence that the link
 * was issued, which is what makes "I never got the email" answerable.
 */
export const emailVerificationTokens = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** sha256 hex of the opaque token. Never the plaintext. */
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("email_verification_tokens_token_hash_key").on(t.tokenHash),
    // "Resend" reads the user's most recent token to decide whether it is
    // throttling or issuing, so this is the hot lookup.
    index("email_verification_tokens_user_idx").on(t.userId, t.createdAt),
  ],
);

export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type NewEmailVerificationToken = typeof emailVerificationTokens.$inferInsert;
