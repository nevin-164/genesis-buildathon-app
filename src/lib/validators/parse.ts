import type { z } from "zod";
import { ValidationError } from "@/lib/auth/errors";

/**
 * Parse `input` against a Zod schema. Returns the parsed value on success,
 * throws a `ValidationError` (with per-field messages) on failure.
 */
export function parseOrThrow<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (result.success) return result.data;

  const fieldErrors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    // Keep only the first error per field
    if (!fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  throw new ValidationError(fieldErrors);
}
