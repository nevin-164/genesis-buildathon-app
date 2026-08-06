import { ValidationError } from "@/lib/auth/errors";

/**
 * Turn a Postgres constraint violation into the field error the form shows.
 *
 * Uniqueness is checked by the database, not by a read-then-write in the
 * controller: between the SELECT and the INSERT another admin can take the same
 * email, and only the unique index actually stops that. So the write is
 * attempted and the violation is translated here.
 */

const UNIQUE_VIOLATION = "23505";
const CHECK_VIOLATION = "23514";
const FOREIGN_KEY_VIOLATION = "23503";

const FIELD_FOR_CONSTRAINT: Record<string, { field: string; message: string }> = {
  users_email_key: {
    field: "email",
    message: "That email address is already in use.",
  },
  student_profiles_register_number_key: {
    field: "registerNumber",
    message: "That register number is already in use.",
  },
  departments_code_key: {
    field: "code",
    message: "A department with this code already exists.",
  },
  batches_department_name_key: {
    field: "name",
    message: "That batch already exists in this department.",
  },
  classes_batch_name_key: {
    field: "name",
    message: "That class already exists in this batch.",
  },
  companies_name_key: {
    field: "name",
    message: "A company with this name already exists.",
  },
};

type PgError = { code: string; constraint_name?: string };

/**
 * Find the Postgres error, wherever it ended up.
 *
 * Drizzle wraps every failed query in a `DrizzleQueryError` whose `name` is
 * just "Error" and whose `code` is undefined — the real `PostgresError`, with
 * the `23505` and the constraint name, hangs off `.cause`. Checking only the
 * top-level object silently turns every duplicate email into a 500, so this
 * walks the chain.
 *
 * Structural, not `instanceof`: this file should not depend on postgres.js or
 * drizzle internals, and both wrappers have changed shape between versions.
 */
function asPgError(error: unknown): PgError | null {
  let current: unknown = error;

  // A short bound rather than `while (true)` — a self-referential cause would
  // otherwise spin forever.
  for (let depth = 0; depth < 5 && current !== null && current !== undefined; depth += 1) {
    if (typeof current !== "object") return null;

    const candidate = current as { code?: unknown; constraint_name?: unknown; cause?: unknown };
    if (typeof candidate.code === "string") {
      return {
        code: candidate.code,
        constraint_name:
          typeof candidate.constraint_name === "string" ? candidate.constraint_name : undefined,
      };
    }

    current = candidate.cause;
  }

  return null;
}

/**
 * Always throws. Call it from a catch block:
 *
 *   try { await Model.create(...) } catch (error) { rethrowAsFieldError(error) }
 *
 * Anything it does not recognise is rethrown untouched, so a genuine bug still
 * reaches the console and the generic "something went wrong" message.
 */
export function rethrowAsFieldError(error: unknown): never {
  const pg = asPgError(error);

  if (pg?.code === UNIQUE_VIOLATION && pg.constraint_name) {
    const mapped = FIELD_FOR_CONSTRAINT[pg.constraint_name];
    if (mapped) throw new ValidationError({ [mapped.field]: mapped.message });
  }

  if (pg?.code === FOREIGN_KEY_VIOLATION) {
    throw new ValidationError({
      _form: "Something you selected no longer exists. Please reload and try again.",
    });
  }

  /**
   * Reaching the reason CHECK means zod let a short reason through, which is a
   * bug in the schema rather than something to translate for the user. Say so
   * loudly in the log; the caller still gets the generic message.
   */
  if (pg?.code === CHECK_VIOLATION && pg.constraint_name === "verification_events_reason_ck") {
    console.error(
      "[bug] verification_events_reason_ck rejected an insert — validation should have caught this first",
      error,
    );
  }

  throw error;
}
