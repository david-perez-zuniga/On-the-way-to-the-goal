import type { Prisma } from "../../infrastructure/db";
import { ValidationError } from '../errors/AppError'

export class Payment {
  constructor(
    public readonly id: string,
    public readonly deposit: Prisma.Decimal,
    public readonly depositDate: Date,
    public readonly currency: string,
    public readonly goalId: string,
  )
  {
    // This guard is what made a persisted 1e-320 deposit fatal: the value was accepted on
    // write, then every subsequent read of the goal threw here and took the endpoint with
    // it. The boundary now rejects such values before they are stored, and this guard
    // remains as defence in depth for rows written by older builds.
    //
    // It must throw a typed domain error. A bare `Error` reached the global handler as an
    // unmapped fault and was reported as a 500, which blamed the client for what is
    // actually a data-integrity condition.
    if (!deposit || !deposit.isFinite()) {
      throw new ValidationError('El monto del abono debe ser un número finito', 'deposit')
    }
    if (deposit.lte(0)) {
      throw new ValidationError('El monto del abono debe ser mayor a cero', 'deposit')
    }
  }
}
