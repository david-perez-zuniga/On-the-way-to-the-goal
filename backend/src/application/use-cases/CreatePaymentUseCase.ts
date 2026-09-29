import { Payment } from "../../domain/entities/Payment";
import { Prisma } from "../../infrastructure/db";
import { type IPaymentRepository } from "../../domain/repositories/IPaymentRepository";
import type { IGoalRepository } from "../../domain/repositories/IGoalRepository";
import { NotFoundError, ValidationError } from '../../domain/errors/AppError';
import { requireMoney, requireCurrency } from '../../infrastructure/validation/validators';

export interface CreatePaymentDTO{
  deposit: number;
  goalId: string;
  currency: string
  /** Owner taken from the verified token. */
  userId: string;
}

/** Fixed conversion rate used when a deposit arrives in a different currency than the goal. */
const USD_TO_NIO = 36.6

export class CreatePaymentUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository,
              private readonly goalRepository: IGoalRepository) {}

  public async execute(data: CreatePaymentDTO): Promise<Payment> {
    const depositDate = new Date();
    const id = crypto.randomUUID();

    // Re-validated here as well as at the perimeter. The use case is an application-layer
    // entry point and must not depend on the caller having already checked the body.
    const deposit = requireMoney(data.deposit, 'deposit')
    const currency = requireCurrency(data.currency)

    // Scoped by owner: previously the goal was fetched by id alone, so anyone could post a
    // deposit into another user's goal and corrupt their progress.
    const goal = await this.goalRepository.findById(data.goalId, data.userId)

    if (goal == null){
      throw new NotFoundError('No se encontró la meta')
    }

    let finalDeposit: Prisma.Decimal;
    if (currency === goal.currency){
      finalDeposit = new Prisma.Decimal(deposit);
    }
    else if (currency === 'NIO' && goal.currency === 'USD'){
      finalDeposit = new Prisma.Decimal(deposit).div(USD_TO_NIO)
    }
    else {
      finalDeposit = new Prisma.Decimal(deposit).mul(USD_TO_NIO)
    }

    // The conversion can collapse a valid deposit to zero, for example a NIO deposit of
    // 0.01 against a USD goal divides to 0.0002, which the column keeps, but a value below
    // 1e-30 would underflow to exactly 0. Reject rather than store a row the read path
    // cannot rebuild.
    if (!finalDeposit.isFinite() || finalDeposit.lte(0)) {
      throw new ValidationError(
        'El monto del abono es inválido para la moneda de la meta',
        'deposit',
      )
    }

    const newPayment = new Payment(
      id,
      finalDeposit,
      depositDate,
      goal.currency,
      data.goalId
    )

    await this.paymentRepository.create(newPayment)
    return newPayment
  }
}
