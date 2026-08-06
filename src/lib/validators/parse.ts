import { z } from "zod";

import { ValidationError } from "@/lib/auth/errors";

/** Issues with no field of their own are reported under this key. */
export const FORM_ERROR_KEY = "_form";

/**
 * Validate, or throw the error the form already knows how to render.
 *
 * `toActionState()` turns a `ValidationError` into `{ fieldErrors }`, keyed by
 * the form control's `name` attribute — which is why the schema field names and
 * the form field names have to match exactly.
 */
export function parseOrThrow<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.map(String).join(".") : FORM_ERROR_KEY;
    // First message wins — a field shows one line, not a stack of them.
    if (fieldErrors[key] === undefined) fieldErrors[key] = issue.message;
  }

  throw new ValidationError(fieldErrors);
}

/** For a single value that is not part of a form object. */
export function parseValueOrThrow<S extends z.ZodType>(
  schema: S,
  value: unknown,
  field: string,
): z.output<S> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  throw new ValidationError({
    [field]: result.error.issues[0]?.message ?? "That value is not valid.",
  });
}
