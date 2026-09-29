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
  // Deliberately strict but structural. Angle brackets and quotes are rejected outright
  // rather than encoded: unlike a free-text field, an address can never legitimately
  // contain them, so accepting and rewriting one would be worse than refusing it.
  // The real authority on uniqueness is the database.
  if (
    !/^[A-Za-z0-9!#$%&'*+/=?^_`{|}~.-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/.test(email) ||
    email.includes('..')
  ) {
    throw new ValidationError('El formato del email no es válido', field)
  }
  return email
}

/**
 * Escapes the two characters that can open an HTML tag.
 *
 * Encoding `<` and `>` is sufficient to neutralise any tag construction, which is the whole
 * of the stored-XSS risk for a text field. Ampersands are deliberately left alone: escaping
 * them would double-encode the literal text `&lt;` a user typed, and it is not needed to
 * prevent a tag from forming.
 */
function encodeMarkup(value: string): string {
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/**
 * Validates a free-text field such as a goal title and stores it HTML-encoded.
 *
 * The frontend currently escapes on render, so this is defence in depth rather than the
 * fix for a live vulnerability. It is here because the guarantee should not depend on a
 * property of one component in one repository: an email, a PDF, a server-side template or a
 * future `dangerouslySetInnerHTML` would all inherit the risk otherwise.
 *
 * Tradeoff, stated plainly: a title containing `<` or `>` is stored encoded, so a client
 * that renders it as text will show `&lt;`. That is accepted in exchange for the stored
 * value being inert in every context. Genuine titles ("Vacaciones 2026", "50%") are
 * unaffected.
 */
export function requireTitle(value: unknown, field = 'title'): string {
  const title = requireString(value, field, { max: TITLE_MAX })
  return encodeMarkup(title)
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
