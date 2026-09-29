import type { Prisma } from "../../infrastructure/db";
import { ValidationError } from '../errors/AppError'
import { assertValidDecimalAmount } from '../valueObjects/amount'

/** Title length ceiling. The domain owns the invariant; the perimeter enforces it early
 *  so the client gets a precise 422 before anything reaches persistence. */
const TITLE_MAX = 120

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
    try {
      assertValidDecimalAmount(totalAmount.toNumber(), 'totalAmount')
    } catch {
      throw new ValidationError(
        'El monto total está fuera del rango permitido',
        'totalAmount',
      )
    }
  }
}
