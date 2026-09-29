import { ValidationError } from '../../domain/errors/AppError'

/**
 * Perimeter validators.
 *
 * These run at the HTTP boundary, before anything touches the domain or the database.
 * Their job is to reject structurally malformed input with a 4XX instead of letting it
 * surface later as a TypeError, a Prisma constraint violation, or a Decimal fault.
 *
 * Deliberately dependency-free: no schema library is added to the project.
 */

/** Upper bound for any monetary amount. Keeps values inside Postgres `numeric(65,30)`
 *  and inside Prisma's Decimal range, so neither overflow (P2020) nor a loss of
 *  precision can occur. Comfortably above any realistic savings-goal total. */
export const MAX_MONEY = 1e12

/** Lower bound for any monetary amount. The column allows 30 decimal places, so a value
 *  below 1e-30 underflows to exactly 0 on write and then poisons the read path. */
export const MIN_MONEY = 0.01

const EMAIL_MAX = 254 // RFC 5321 practical maximum
const PASSWORD_MIN = 8
const PASSWORD_MAX = 128 // bcrypt truncates beyond 72 bytes; refuse rather than silently truncate
const TITLE_MAX = 120
const CURRENCY_MAX = 8

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

/**
 * Validates a monetary amount as a plain finite number inside a safe range.
 * Rejects NaN, Infinity, -Infinity, booleans, numeric strings, arrays, objects and null,
 * as well as values that would overflow or underflow the Decimal column.
 */
export function requireMoney(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ValidationError(
      `El campo "${field}" debe ser un número finito`,
      field,
    )
  }
  if (value < MIN_MONEY) {
    throw new ValidationError(
      `El campo "${field}" debe ser mayor o igual a ${MIN_MONEY}`,
      field,
    )
  }
  if (value > MAX_MONEY) {
    throw new ValidationError(
      `El campo "${field}" excede el máximo permitido de ${MAX_MONEY}`,
      field,
    )
  }
  return value
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
