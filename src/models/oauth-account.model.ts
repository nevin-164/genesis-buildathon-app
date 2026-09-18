import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { oauthAccounts } from "@/db/schema/oauth-accounts";
import type { OAuthProvider } from "@/db/schema/enums";

export const OAuthAccountModel = {
  async findByProviderAccount(provider: OAuthProvider, providerAccountId: string) {
    const [row] = await db
      .select()
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.provider, provider),
          eq(oauthAccounts.providerAccountId, providerAccountId),
        ),
      )
      .limit(1);

    return row ?? null;
  },

  async link(data: {
    userId: string;
    provider: OAuthProvider;
    providerAccountId: string;
    providerEmail: string;
  }) {
    const [row] = await db.insert(oauthAccounts).values(data).returning();
    return row;
  },
};
