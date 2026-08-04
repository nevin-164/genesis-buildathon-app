import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __internlensSql: ReturnType<typeof postgres> | undefined;
}

/**
 * `prepare: false` is REQUIRED on Supabase's Supavisor pooler (port 6543) —
 * transaction pooling does not support prepared statements.
 * The client is cached on globalThis so dev hot-reload doesn't leak connections.
 */
const client =
  globalThis.__internlensSql ??
  postgres(process.env.DATABASE_URL!, {
    prepare: false,
    max: 5,
    idle_timeout: 20,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__internlensSql = client;
}

export const db = drizzle(client, { schema });
export * from "./schema";
