import { Payment } from "../../domain/entities/Payment";
import { Prisma } from "../../infrastructure/db";
import { type IPaymentRepository } from "../../domain/repositories/IPaymentRepository";
import type { IGoalRepository } from "../../domain/repositories/IGoalRepository";

export interface CreatePaymentDTO{
  deposit: number;
  goalId: string;
  currency: string
}

export class CreatePaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository,
              private readonly goalRepository: IGoalRepository) {}

  public async execute(data: CreatePaymentDTO): Promise<Payment> {
    const depositDate = new Date()
    const id = crypto.randomUUID();
    const goal = await this.goalRepository.findById(data.goalId)

    if (goal == null){
      throw new Error('No se encontró la meta')
    }

    const newPayment = new Payment(
      id,
      new Prisma.Decimal(data.deposit),
      depositDate,
      data.currency,
      data.goalId
    )
    
    await this.paymentRepository.create(newPayment)
    return newPayment
  }  
}
