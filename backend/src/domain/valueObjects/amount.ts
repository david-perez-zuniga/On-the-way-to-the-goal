/**
 * Domain value rules for monetary amounts.
 *
 * These live in the domain because they are business invariants, not transport concerns:
 * a goal total or a deposit below the floor cannot be represented by the column and, for a
 * goal total of zero, makes progress percentage undefined. The HTTP perimeter enforces
 * them early for a precise 422; the domain re-uses them so a use case or an entity does not
 * depend on a transport-layer validator. That direction is the whole point: infrastructure
 * may depend on the domain, never the reverse.
 */

export const MIN_MONEY = 0.01
export const MAX_MONEY = 1e12

export class InvalidAmountError extends Error {
  constructor(
    message: string,
    public readonly field: string,
  ) {
    super(message)
    this.name = 'InvalidAmountError'
  }
}

function asFiniteNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new InvalidAmountError(`El campo "${field}" debe ser un número finito`, field)
  }
  return value
}

/** Validates a raw client-supplied amount and returns it as a plain number. */
export function assertValidAmount(value: unknown, field: string): number {
  const amount = asFiniteNumber(value, field)

  if (amount < MIN_MONEY) {
    throw new InvalidAmountError(
      `El campo "${field}" debe ser mayor o igual a ${MIN_MONEY}`,
      field,
    )
  }
  if (amount > MAX_MONEY) {
    throw new InvalidAmountError(
      `El campo "${field}" excede el máximo permitido de ${MAX_MONEY}`,
      field,
    )
  }
  return amount
}

/** Applies the same range rules to an amount that has already been coerced to a Decimal. */
export function assertValidDecimalAmount(value: number, field: string): void {
  assertValidAmount(value, field)
}
