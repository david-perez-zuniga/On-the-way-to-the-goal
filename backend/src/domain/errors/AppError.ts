/**
 * Typed domain errors.
 *
 * The domain must not know about HTTP. These carry a stable semantic code that the
 * infrastructure layer translates into a status code. Throwing a bare `Error` from the
 * domain is what previously forced every controller into a blanket 500.
 */
export abstract class AppError extends Error {
  protected constructor(
    message: string,
    /** Stable, machine-readable identifier for the client. */
    public readonly code: string,
  ) {
    super(message)
    this.name = new.target.name
    Error.captureStackTrace?.(this, new.target)
  }
}

/** Input violated a domain invariant. Maps to 422. */
export class ValidationError extends AppError {
  constructor(message: string, public readonly field?: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

/** A required resource does not exist, or the caller may not know that it exists. Maps to 404. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 'NOT_FOUND')
  }
}

/** The request is well-formed but conflicts with current state (e.g. duplicate email). Maps to 409. */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT')
  }
}

/** Authentication failed. Maps to 401. Must be used only for genuine credential
 *  failures: previously every error in the login path collapsed into a 401, which hid
 *  real outages behind "invalid credentials". */
export class UnauthorizedError extends AppError {
  constructor(message = 'Credenciales inválidas') {
    super(message, 'UNAUTHORIZED')
  }
}

/** The caller is authenticated but does not own the target resource. Maps to 404, not 403,
 *  so that ownership probing does not confirm the resource exists. */
export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 'FORBIDDEN')
  }
}
