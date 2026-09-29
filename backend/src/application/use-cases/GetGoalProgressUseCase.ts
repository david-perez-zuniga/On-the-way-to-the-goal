import { Goal } from "../../domain/entities/Goal";
import { type IGoalRepository } from "../../domain/repositories/IGoalRepository";
import { type IPaymentRepository } from "../../domain/repositories/IPaymentRepository";
import { Prisma } from "../../infrastructure/db";
import { NotFoundError } from '../../domain/errors/AppError';

export interface GetGoalProgressDTO{
  goalId: string;
  /** Owner taken from the verified token, used to scope the lookup. */
  userId: string;
}

export interface GetGoalProgressResponseDTO{
  goal: Goal;
  currentAmount: Prisma.Decimal;
  percentage: number;
}

export class GetGoalProgressUseCase{
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly paymentRepository: IPaymentRepository
  ){}

  public async execute(data: GetGoalProgressDTO): Promise<GetGoalProgressResponseDTO | null>{
    // Scoped by owner: a goal belonging to somebody else is reported as not found, so this
    // endpoint cannot be used to probe for the existence of another user's goals.
    const getGoal = await this.goalRepository.findById(data.goalId, data.userId)

    if (getGoal == null){
      throw new NotFoundError('Meta no encontrada')
    }

    const getPayment = await this.paymentRepository.findByGoalId(data.goalId, data.userId)
    const currentAmount = getPayment.reduce((sum, payment) => {
      return sum.add(payment.deposit);
    }, new Prisma.Decimal(0));

    // A zero total divides to a DecimalDivisionByZeroError, which was reported as a 500.
    // The entity now rejects a zero total on write, but this guard also protects rows that
    // predate that rule, so the read path can never fault.
    const percentage = getGoal.totalAmount.gt(0)
      ? currentAmount.div(getGoal.totalAmount).mul(100).toNumber()
      : 0

    return {goal: getGoal, currentAmount, percentage}
  }
}
