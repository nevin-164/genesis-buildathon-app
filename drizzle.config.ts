import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // DDL must go over the DIRECT connection (port 5432), not the pooler.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
