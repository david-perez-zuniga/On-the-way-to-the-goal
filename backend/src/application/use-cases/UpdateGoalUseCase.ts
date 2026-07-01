import { Goal } from '../../domain/entities/Goal';
import { Prisma } from '../../infrastructure/db';
import { type IGoalRepository } from '../../domain/repositories/IGoalRepository';

export interface UpdateGoalDTO {
  id: string;
  title: string;
  totalAmount: number;
  currency: string;
  userId: string;
  createdAt: Date;
  finishedAt: Date | null;
}

export class UpdateGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  public async execute(data: UpdateGoalDTO): Promise<Goal> {
    const updatedAt = new Date();

    const updatedGoal = new Goal(
      data.id,
      data.title,
      new Prisma.Decimal(data.totalAmount),
      data.currency,
      data.userId,
      data.createdAt,
      updatedAt,
      data.finishedAt
    );

    await this.goalRepository.update(updatedGoal);
    return updatedGoal;
  }
}
