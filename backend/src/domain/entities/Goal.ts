import type { Prisma } from "../../infrastructure/db";
import { ValidationError } from '../errors/AppError'

/** Mirrors infrastructure/validation/validators.ts. The domain owns the invariant; the
 *  perimeter enforces it earlier so the client gets a fast, precise 422. */
const TITLE_MAX = 120
const MIN_MONEY = 0.01
const MAX_MONEY = 1e12

// Contrato del modelo Goal
export class Goal {
  constructor(
    public readonly id: string,
    public title: string,
    public totalAmount: Prisma.Decimal,
    public currency: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly finishedAt: Date | null
  ) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      throw new ValidationError('El título de la meta no puede estar vacío', 'title')
    }
    if (title.length > TITLE_MAX) {
      throw new ValidationError(
        `El título de la meta no puede superar los ${TITLE_MAX} caracteres`,
        'title',
      )
    }
    if (typeof currency !== 'string' || !/^[A-Za-z]{3}$/.test(currency)) {
      throw new ValidationError('La moneda debe ser un código ISO de 3 letras', 'currency')
    }
    // A zero or negative total is not merely odd, it is dangerous: progress is computed as
    // currentAmount / totalAmount, so a zero total is a division by zero on the read path.
    if (!totalAmount || !totalAmount.isFinite()) {
      throw new ValidationError('El monto total debe ser un número finito', 'totalAmount')
    }
    const asNumber = totalAmount.toNumber()
    if (asNumber < MIN_MONEY) {
      throw new ValidationError(
        `El monto total debe ser mayor o igual a ${MIN_MONEY}`,
        'totalAmount',
      )
    }
    if (asNumber > MAX_MONEY) {
      throw new ValidationError(
        `El monto total no puede superar ${MAX_MONEY}`,
        'totalAmount',
      )
    }
  }
}
