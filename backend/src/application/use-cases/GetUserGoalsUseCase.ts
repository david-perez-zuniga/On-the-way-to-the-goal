import { type IGoalRepository } from '../../domain/repositories/IGoalRepository'
import { type IPaymentRepository } from '../../domain/repositories/IPaymentRepository'
import { Prisma } from '../../infrastructure/db'

export interface GoalProgress {
  id: string
  title: string
  totalAmount: number
  currency: string
  currentAmount: number
  percentage: number
  createdAt: Date
  updatedAt: Date
  finishedAt: Date | null
}

export class GetUserGoalsUseCase {
  constructor(
    private readonly goalRepository: IGoalRepository,
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  public async execute(userId: string): Promise<GoalProgress[]> {
    const goals = await this.goalRepository.findAll(userId)

    const result: GoalProgress[] = []

    for (const goal of goals) {
      const payments = await this.paymentRepository.findByGoalId(goal.id)
      const currentAmount = payments.reduce((sum, p) => sum.add(p.deposit), new Prisma.Decimal(0))
      const total = new Prisma.Decimal(goal.totalAmount)
      const percentage = total.gt(0) ? currentAmount.div(total).mul(100).toNumber() : 0

      result.push({
        id: goal.id,
        title: goal.title,
        totalAmount: total.toNumber(),
        currency: goal.currency,
        currentAmount: currentAmount.toNumber(),
        percentage: Math.round(percentage * 100) / 100,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        finishedAt: goal.finishedAt,
      })
    }

    return result
  }
}
