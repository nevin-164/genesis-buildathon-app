import type { ZodError } from "zod";

/**
 * Turns a zod failure into the `{ fieldName: message }` map that `ActionState`
 * carries and `<Field error={…}>` renders.
 *
 * First message per field wins. Three complaints stacked under one input is
 * noise, and the user fixes them one at a time anyway.
 */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !(field in errors)) errors[field] = issue.message;
  }

  return errors;
}
