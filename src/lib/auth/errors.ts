/** Not signed in. Maps to HTTP 401. */
export class UnauthorizedError extends Error {
  constructor(message = "Sign in required.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** Signed in, but not allowed to do this. Maps to HTTP 403. */
export class ForbiddenError extends Error {
  constructor(message = "You are not allowed to do this.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Missing — or hidden. Throw this instead of ForbiddenError when the caller
 * should not even learn that the row exists. Maps to HTTP 404.
 */
export class NotFoundError extends Error {
  constructor(message = "Not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** An illegal state transition, or someone else changed it first. HTTP 409. */
export class InvalidStateError extends Error {
  constructor(message = "This was just changed by someone else. Please reload.") {
    super(message);
    this.name = "InvalidStateError";
  }
}

/** Input failed validation. Carries per-field messages for the form. */
export class ValidationError extends Error {
  fieldErrors: Record<string, string>;
  constructor(fieldErrors: Record<string, string>, message = "Please fix the errors below.") {
    super(message);
    this.name = "ValidationError";
    this.fieldErrors = fieldErrors;
  }
}
