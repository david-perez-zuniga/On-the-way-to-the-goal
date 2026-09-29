import { Prisma } from "../db";
import { prisma } from "../db/prisma";
import { type IPaymentRepository } from "../../domain/repositories/IPaymentRepository";
import { Payment } from "../../domain/entities/Payment";

export class PrismaPaymentRepository implements IPaymentRepository {

  public async create(payment: Payment): Promise<void>{
      await prisma.payment.create({
      data: {
        id: payment.id,
        deposit: new Prisma.Decimal(payment.deposit),
        depositDate: payment.depositDate,
        currency: payment.currency,
        goalId: payment.goalId
      }
    });
  }

  /**
   * Ownership is resolved through the parent goal. A payment id alone is never trusted:
   * requiring the goal to belong to the caller closes both the history leak and the ability
   * to post deposits into somebody else's goal.
   */
  public async findByGoalId(idGoal: string, userId: string): Promise<Payment[]> {
    const records = await prisma.payment.findMany({
      where: { goalId: idGoal, goal: { userId } },
    });

    // As with goals, a single legacy row that cannot be rebuilt is skipped rather than
    // allowed to fault the whole history response.
    const payments: Payment[] = [];
    for (const record of records) {
      try {
        payments.push(
          new Payment(record.id, record.deposit, record.depositDate, record.currency, record.goalId),
        )
      } catch (error) {
        console.warn(
          `[data-integrity] payment ${record.id} violates an invariant and was omitted: ${
            (error as Error)?.message
          }`,
        )
      }
    }
    return payments
  }
}
