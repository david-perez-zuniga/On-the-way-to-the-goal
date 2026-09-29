import { ValidationError } from '../../domain/errors/AppError'
import { assertValidAmount, InvalidAmountError, MIN_MONEY, MAX_MONEY } from '../../domain/valueObjects/amount'

/**
 * Perimeter validators.
 *
 * These run at the HTTP boundary, before anything touches the domain or the database.
 * Their job is to reject structurally malformed input with a 4XX instead of letting it
 * surface later as a TypeError, a Prisma constraint violation, or a Decimal fault.
 *
 * Deliberately dependency-free: no schema library is added to the project.
 *
 * The monetary range rules are not restated here. They are imported from the domain, where
 * they belong as business invariants, so the boundary and the use case cannot drift apart.
 */

const EMAIL_MAX = 254 // RFC 5321 practical maximum
const PASSWORD_MIN = 8
const PASSWORD_MAX = 128 // bcrypt truncates beyond 72 bytes; refuse rather than silently truncate
const TITLE_MAX = 120
const CURRENCY_MAX = 8

export { MIN_MONEY, MAX_MONEY }

export function requireObjectBody(body: unknown): Record<string, unknown> {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('El cuerpo de la petición debe ser un objeto JSON')
  }
  return body as Record<string, unknown>
}

export function requireString(
  value: unknown,
  field: string,
  { min = 1, max = 255 }: { min?: number; max?: number } = {},
): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`El campo "${field}" debe ser una cadena de texto`, field)
  }
  // A NUL byte cannot be stored in a Postgres `text` column: the write fails with SQLSTATE
  // 22021 ("invalid byte sequence for encoding UTF8: 0x00"), which the global handler can only
  // report as a 500. Any client could therefore trigger a server fault with a single
  // character. Rejecting C0 control characters here turns that into a 422 and keeps the
  // "no input produces a 5XX" property true. Tab, newline and carriage return are allowed
  // because they are legitimate in text; the remaining C0 codes are not.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/.test(value)) {
    throw new ValidationError(
      `El campo "${field}" contiene caracteres de control no permitidos`,
      field,
    )
  }
  const trimmed = value.trim()
  if (trimmed.length < min) {
    throw new ValidationError(`El campo "${field}" no puede estar vacío`, field)
  }
  if (value.length > max) {
    throw new ValidationError(
      `El campo "${field}" excede el máximo de ${max} caracteres (recibido: ${value.length})`,
      field,
    )
  }
  return value
}

export function requireEmail(value: unknown, field = 'email'): string {
  const email = requireString(value, field, { max: EMAIL_MAX })
  // Deliberately permissive but structural: one @, non-empty local part, dotted domain,
  // no whitespace or control characters. The real authority on uniqueness is the database.
  if (
    !/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email) ||
    /[\x00-\x1f\x7f]/.test(email)
  ) {
    throw new ValidationError('El formato del email no es válido', field)
  }
  return email
}

export function requirePassword(value: unknown, field = 'password'): string {
  if (typeof value !== 'string') {
    throw new ValidationError(`El campo "${field}" debe ser una cadena de texto`, field)
  }
  if (value.length < PASSWORD_MIN) {
    throw new ValidationError(
      `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`,
      field,
    )
  }
  if (value.length > PASSWORD_MAX) {
    throw new ValidationError(
      `La contraseña no puede superar los ${PASSWORD_MAX} caracteres`,
      field,
    )
  }
  // A NUL byte in a password is never legitimate and truncates C-string consumers.
  if (value.includes('\u0000')) {
    throw new ValidationError('La contraseña contiene caracteres no permitidos', field)
  }
  return value
}

export function requirePasswordConfirmation(value: unknown, field = 'passwordConfirmation'): string {
  if (typeof value !== 'string') {
    throw new ValidationError(
      `El campo "${field}" debe ser una cadena de texto`,
      field,
    )
  }
  // Length bounds mirror requirePassword. The mismatch check itself lives in the caller,
  // which has both values in scope.
  if (value.length < PASSWORD_MIN || value.length > PASSWORD_MAX) {
    throw new ValidationError(
      `La confirmación no puede tener menos de ${PASSWORD_MIN} ni más de ${PASSWORD_MAX} caracteres`,
      field,
    )
  }
  if (value.includes('\u0000')) {
    throw new ValidationError('La confirmación contiene caracteres no permitidos', field)
  }
  return value
}

/**
 * Validates a monetary amount as a plain finite number inside a safe range.
 * Rejects NaN, Infinity, -Infinity, booleans, numeric strings, arrays, objects and null,
 * as well as values that would overflow or underflow the Decimal column.
 *
 * Delegates the range rules to the domain so the two layers cannot disagree.
 */
export function requireMoney(value: unknown, field: string): number {
  try {
    return assertValidAmount(value, field)
  } catch (error) {
    if (error instanceof InvalidAmountError) {
      throw new ValidationError(error.message, error.field)
    }
    throw error
  }
}

export function requireCurrency(value: unknown, field = 'currency'): string {
  const currency = requireString(value, field, { max: CURRENCY_MAX })
  if (!/^[A-Za-z]{3}$/.test(currency)) {
    throw new ValidationError(
      'La moneda debe ser un código ISO de 3 letras (por ejemplo USD o NIO)',
      field,
    )
  }
  return currency.toUpperCase()
}

/** Validates a path/query identifier without assuming it is a UUID, so that a malformed
 *  id produces a 4XX instead of a database error. */
export function requireId(value: unknown, field: string): string {
  const id = requireString(value, field, { max: 128 })
  if (!/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new ValidationError(`El identificador "${field}" no tiene un formato válido`, field)
  }
  return id
}

/** Optional ISO-8601 timestamp, or null. Rejects strings Prisma DateTime cannot parse. */
export function requireOptionalDate(value: unknown, field: string): Date | null {
  if (value === undefined || value === null) return null
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`El campo "${field}" debe ser una fecha ISO-8601 válida`, field)
  }
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`El campo "${field}" no es una fecha válida`, field)
  }
  return parsed
}
