import {
  ForbiddenError,
  InvalidStateError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/lib/auth/errors";
import type { ActionState } from "@/types/contracts";

/**
 * Re-exported so a Server Action can take the type and the mapper from the
 * same import. The definition still lives in types/contracts.ts.
 */
export type { ActionState };

/**
 * Every Server Action funnels its catch block through this, so error handling
 * looks the same in all six packages.
 *
 *   } catch (error) {
 *     return toActionState(error);
 *   }
 */
export function toActionState(error: unknown): ActionState {
  if (error instanceof ValidationError) {
    return { ok: false, message: error.message, fieldErrors: error.fieldErrors };
  }
  if (error instanceof UnauthorizedError) {
    return { ok: false, message: "Please sign in again." };
  }
  if (error instanceof ForbiddenError) {
    return { ok: false, message: error.message };
  }
  if (error instanceof NotFoundError) {
    return { ok: false, message: "Not found." };
  }
  if (error instanceof InvalidStateError) {
    return { ok: false, message: error.message };
  }

  // Anything else is a bug. Log the real thing, show the user something safe.
  console.error("[action]", error);
  return { ok: false, message: "Something went wrong. Please try again." };
}
