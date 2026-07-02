import type { Prisma } from "../../infrastructure/db";

export class Payment {
  constructor(
    public readonly id: string,
    public readonly amount: Prisma.Decimal,
    public readonly createdAt: Date,
    public readonly goalId: string,
  )
  {
    if (amount.lte(0)) {
      throw new Error('El monto del abono debe ser mayor a cero');
    }
  }
}
