import type { Prisma } from "../../infrastructure/db";

// Contrato del modelo Goal
export class Goal {
  constructor(
    public readonly id: string,
    public title: string,
    public totalAmount: Prisma.Decimal,
    public currency: string,
    public userId: string,
    public createdAt: Date,
    public updatedAt: Date,
    public finishedAt: Date | null
  ) {}
}
