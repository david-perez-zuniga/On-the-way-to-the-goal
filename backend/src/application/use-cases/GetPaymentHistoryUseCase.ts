import { Payment } from "../../domain/entities/Payment";
import { type IPaymentRepository } from "../../domain/repositories/IPaymentRepository";

export interface GetPaymentHistoryDTO {
  goalId: string;
}

export class GetPaymentHistoryUseCase {
  constructor(private readonly paymentRepository: IPaymentRepository){}

  public async execute(data: GetPaymentHistoryDTO): Promise<Payment[]> {
    return await this.paymentRepository.findByGoalId(data.goalId)
  }

}
