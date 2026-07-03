import { Prisma } from "../db";
import { prisma } from "../db/prisma";
import { type IPaymentRepository } from "../../domain/repositories/IPaymentRepository";
import { Payment } from "../../domain/entities/Payment";
import { PrismaGoalRepository } from "./PrismaGoalRepository";

export class PrismaPaymentRepository implements IPaymentRepository {

   public async create(payment: Payment): Promise<void>{
    await prisma.payment.create({
      data: {
        id: payment.id,
        deposit: new Prisma.Decimal(payment.deposit),
        depositDate: payment.depositDate,
        goalId: payment.goalId
      }
    });
  }

}
