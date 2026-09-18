import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { userRoleEnum } from "./enums";

/** One table for all three roles. Stored email is always lower-cased and trimmed. */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    /**
     * bcryptjs — and NULLABLE, because a user who only ever signed in through
     * Google has no password to hash.
     *
     * ─────────────────────────────────────────────────────────────────────────
     * Every read of this column must handle null. `login/actions.ts` treats a
     * null hash as "wrong credentials" rather than calling bcrypt with it: the
     * account is real, it simply has no password, and saying so out loud would
     * tell an attacker which accounts are worth a provider phishing attempt.
     * ─────────────────────────────────────────────────────────────────────────
     */
    passwordHash: text("password_hash"),
    fullName: text("full_name").notNull(),
    role: userRoleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    /**
     * Null until they follow the link in their registration email. A provider
     * sign-in sets it at link time without sending anything — Google has
     * already proved the address, and asking them to prove it twice is a step
     * that only loses people.
     */
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    /**
     * Bumped on password change, role change, deactivation and sign-out-everywhere.
     * The DAL compares it to the JWT's `sv` claim, so an already-minted access
     * token dies on the next request instead of living out its 15 minutes.
     */
    sessionVersion: integer("session_version").notNull().default(1),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("users_email_key").on(t.email),
    index("users_role_idx").on(t.role, t.isActive),
  ],
);

/**
 * One row per issued refresh token. `family_id` is the session; rotation inserts
 * a child row in the same family and stamps `rotated_at` on the parent.
 * A token consumed more than the grace window ago and presented again is reuse:
 * revoke the whole family.
 */
export const authSessions = pgTable(
  "auth_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").notNull(),
    /** sha256 hex of the opaque token. Never the plaintext. */
    tokenHash: text("token_hash").notNull(),
    /** Absolute — inherited unchanged by every child in the chain. */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("auth_sessions_token_hash_key").on(t.tokenHash),
    index("auth_sessions_family_idx").on(t.familyId),
    index("auth_sessions_user_idx").on(t.userId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type AuthSession = typeof authSessions.$inferSelect;
