import { Goal } from "../../domain/entities/Goal";
import { type IGoalRepository } from "../../domain/repositories/IGoalRepository";
import type { IPaymentRepository } from "../../domain/repositories/IPaymentRepository";
import { Prisma } from "../../infrastructure/db"; 

export interface GetGoalProgressDTO{
  goalId: string;
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
    const getGoal = await this.goalRepository.findById(data.goalId)

    if (getGoal == null){
      throw new Error('Meta no encontrada')
    }

    const getPayment = await this.paymentRepository.findByGoalId(data.goalId)
    const currentAmount = getPayment.reduce((sum, payment) => {
    return sum.add(payment.deposit);  
    }, new Prisma.Decimal(0));

    const percentage = currentAmount.div(getGoal.totalAmount).mul(100).toNumber();
    return {goal: getGoal, currentAmount, percentage}
  }
  
}
