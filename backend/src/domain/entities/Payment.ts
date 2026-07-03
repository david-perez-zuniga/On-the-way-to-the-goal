import type { Prisma } from "../../infrastructure/db";

export class Payment {
  constructor(
    public readonly id: string,
    public readonly deposit: Prisma.Decimal,
    public readonly depositDate: Date,
    public readonly currency: string,
    public readonly goalId: string,
  )
  {
    if (deposit.lte(0)) {
      throw new Error('El monto del abono debe ser mayor a cero');
    }
  }
}
