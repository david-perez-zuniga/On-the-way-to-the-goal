import { Payment } from "../../domain/entities/Payment";
import { type IPaymentRepository } from "../../domain/repositories/IPaymentRepository";
import { type IGoalRepository } from "../../domain/repositories/IGoalRepository";
import { NotFoundError } from '../../domain/errors/AppError';

export interface GetPaymentHistoryDTO {
  goalId: string;
  /** Owner taken from the verified token, used to scope the query. */
  userId: string;
}

export class GetPaymentHistoryUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly goalRepository: IGoalRepository,
  ){}

  public async execute(data: GetPaymentHistoryDTO): Promise<Payment[]> {
    // A goal that does not exist and a goal owned by somebody else are both answered with
    // 404, so this endpoint cannot be used to discover another user's goal ids. Without
    // this check an empty history for a foreign goal was indistinguishable from a valid
    // empty result, which leaked whether the goal existed.
    const goal = await this.goalRepository.findById(data.goalId, data.userId)
    if (goal === null) {
      throw new NotFoundError('Meta no encontrada')
    }

    return await this.paymentRepository.findByGoalId(data.goalId, data.userId)
  }
}
