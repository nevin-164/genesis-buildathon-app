#!/usr/bin/env node
/**
 * Copy the local .env into a Vercel environment.
 *
 * `vercel env add` takes one variable per invocation and prompts for the value,
 * so seeding a project by hand is fifteen commands and fifteen paste operations
 * — which is where a service-role key ends up in the wrong environment.
 *
 * Usage:
 *   node scripts/vercel-env-push.mjs                     # → production
 *   node scripts/vercel-env-push.mjs preview
 *   node scripts/vercel-env-push.mjs production --dry-run
 *   node scripts/vercel-env-push.mjs production --file .env.production
 *
 * Values are piped on stdin, never passed as arguments — an argument would show
 * up in the shell history and in the process list. Nothing here prints a value,
 * including on failure.
 *
 * Re-running is safe: every add passes --force, so this overwrites rather than
 * erroring on a key that is already set.
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const ENVIRONMENTS = new Set(["production", "preview", "development"]);

/**
 * Not pushed, whatever the file says.
 *
 * DIRECT_URL is the unpooled connection on port 5432 and belongs to
 * `drizzle-kit` alone — migrations are run from a laptop, never from a
 * function. Putting it in a runtime environment only creates a second way for
 * the app to reach the database while bypassing the pooler.
 */
const NEVER_PUSH = new Set(["DIRECT_URL", "NODE_ENV", "PORT"]);

/**
 * Stored write-only, so the dashboard shows the key but never the value.
 *
 * NEXT_PUBLIC_* is deliberately absent: it is inlined into the client bundle at
 * build time, so marking it secret would protect nothing and only make the
 * value awkward to check later.
 */
const SECRET = new Set([
  "DATABASE_URL",
  "AUTH_JWT_SECRET",
  "SUPABASE_SERVICE_ROLE_KEY",
  "UPSTASH_REDIS_REST_TOKEN",
  "GOOGLE_CLIENT_SECRET",
  "MAILGUN_API_KEY",
  "ANTHROPIC_API_KEY",
]);

/**
 * A localhost value is correct in `.env` and wrong everywhere else, and the two
 * keys it applies to fail silently rather than loudly: `APP_BASE_URL` and
 * `OAUTH_REDIRECT_BASE_URL` would put "http://localhost:3000" into every
 * verification email and every OAuth handshake on the deployment.
 *
 * Blank is better than wrong here, because `lib/base-url.ts` falls back to the
 * URL Vercel reports for the deployment. So these are refused, not pushed.
 */
function isLocalhost(value) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?\/?$/i.test(value);
}

function parseEnvFile(path) {
  const out = [];

  for (const raw of readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    // Anything else is not a shell-safe env name, and it is about to become a
    // command argument. Refuse rather than sanitise.
    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) continue;

    let value = line.slice(eq + 1).trim();
    if (value.length > 1 && /^(".*"|'.*')$/s.test(value)) value = value.slice(1, -1);

    out.push([key, value]);
  }

  return out;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const fileFlag = args.indexOf("--file");
  const file = fileFlag === -1 ? ".env" : args[fileFlag + 1];
  const target = args.find((a) => ENVIRONMENTS.has(a)) ?? "production";

  if (!file || !existsSync(file)) {
    console.error(`No such env file: ${file ?? "(missing --file value)"}`);
    process.exit(1);
  }

  if (!existsSync(".vercel/project.json")) {
    console.error(
      "This directory is not linked to a Vercel project.\n" +
        "Run `vercel login` and then `vercel link` first.",
    );
    process.exit(1);
  }

  const entries = parseEnvFile(file);
  const pushed = [];
  const skipped = [];
  const failed = [];

  console.log(`Pushing ${file} → ${target}${dryRun ? "  (dry run)" : ""}\n`);

  for (const [key, value] of entries) {
    if (NEVER_PUSH.has(key)) {
      skipped.push(`${key} (never pushed)`);
      continue;
    }
    if (!value) {
      // A blank key in .env means "this integration is off". Every one of them
      // degrades to a working no-op, so pushing an empty string would only
      // create a variable that reads as configured and is not.
      skipped.push(`${key} (blank)`);
      continue;
    }
    if (isLocalhost(value)) {
      skipped.push(`${key} (localhost — set it in the dashboard once you have a domain)`);
      continue;
    }

    const sensitivity = SECRET.has(key) ? "--sensitive" : "--no-sensitive";
    const argv = ["env", "add", key, target, "--force", sensitivity, "--yes"];

    if (dryRun) {
      pushed.push(`${key}${SECRET.has(key) ? " (secret)" : ""}`);
      continue;
    }

    const run = spawnSync("vercel", argv, {
      input: value,
      encoding: "utf8",
      shell: true,
    });

    if (run.status === 0) {
      pushed.push(`${key}${SECRET.has(key) ? " (secret)" : ""}`);
    } else {
      // stderr can echo the value back on some failures. Report the key only.
      failed.push(key);
    }
  }

  for (const key of pushed) console.log(`  set      ${key}`);
  for (const key of skipped) console.log(`  skipped  ${key}`);
  for (const key of failed) console.log(`  FAILED   ${key}`);

  console.log(
    `\n${pushed.length} set, ${skipped.length} skipped, ${failed.length} failed.`,
  );

  if (failed.length > 0) {
    console.error("\nRe-run with `vercel env add <KEY> " + target + "` to see why.");
    process.exit(1);
  }
}

main();
