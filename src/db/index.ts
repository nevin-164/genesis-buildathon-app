import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { recordQuery } from "@/lib/perf";

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

/**
 * The logger counts statements for the Explore performance badge.
 *
 * It is NOT a query log — nothing is printed and no parameters are touched, so
 * no student data reaches a console. `recordQuery` is a single
 * `AsyncLocalStorage.getStore()` that returns undefined unless a `measure()`
 * call is on the stack, which is every request except a deliberate `?perf=`
 * one. Drizzle only calls this because `logger` is set, so the cost on a normal
 * request is one map lookup per query.
 */
export const db = drizzle(client, {
  schema,
  logger: { logQuery: (query) => recordQuery(query) },
});
export * from "./schema";
