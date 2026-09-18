import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

import { oauthProviderEnum } from "./enums";
import { users } from "./users";

/**
 * One row per provider account linked to a user. A person who signs in with
 * both Google and GitHub on the same email has one `users` row and two of
 * these.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE LINK IS BY EMAIL, AND IT IS DELIBERATE. A callback that finds no row here
 * must look the email up in `users` before inserting anything: the same person
 * arriving by a second route is a link, not a new account. Inserting blindly
 * hits `users_email_key` and presents to them as "registration is broken".
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * No access or refresh token is stored. We use the provider once, to learn who
 * they are, and then issue our own session — so there is nothing to keep, and
 * nothing to leak.
 */
export const oauthAccounts = pgTable(
  "oauth_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: oauthProviderEnum("provider").notNull(),
    /** The provider's own id for this account — `sub` on Google, `id` on GitHub. */
    providerAccountId: text("provider_account_id").notNull(),
    /**
     * What the provider said the email was at link time. Kept for support
     * questions only. `users.email` is the one the app actually uses, and the
     * two are allowed to drift.
     */
    providerEmail: text("provider_email"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    // One provider account belongs to exactly one user. This is the constraint
    // that makes the callback safe to run concurrently.
    uniqueIndex("oauth_accounts_provider_account_key").on(t.provider, t.providerAccountId),
    index("oauth_accounts_user_idx").on(t.userId),
  ],
);

export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert;
