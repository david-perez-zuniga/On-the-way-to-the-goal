import { Goal } from '../../domain/entities/Goal';
import { Prisma } from '../../infrastructure/db';
import { type IGoalRepository } from '../../domain/repositories/IGoalRepository';
import { NotFoundError } from '../../domain/errors/AppError';

export interface UpdateGoalDTO {
  id: string;
  title: string;
  totalAmount: number;
  currency: string;
  /** Owner taken from the verified token. Used only to scope the update. */
  userId: string;
  finishedAt: Date | null;
}

export class UpdateGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  public async execute(data: UpdateGoalDTO): Promise<Goal> {
    // The stored record is the authority for `createdAt` and ownership. Previously the
    // caller supplied both `createdAt` and `userId` in the request body, which let a client
    // forge the audit timestamp and reassign the goal to a different account.
    const existing = await this.goalRepository.findById(data.id, data.userId)
    if (existing === null) {
      throw new NotFoundError('Meta no encontrada')
    }

    const updatedAt = new Date();

    const updatedGoal = new Goal(
      existing.id,
      data.title,
      new Prisma.Decimal(data.totalAmount),
      data.currency,
      existing.userId,
      existing.createdAt,
      updatedAt,
      data.finishedAt
    );

    await this.goalRepository.update(updatedGoal, data.userId);
    return updatedGoal;
  }
}
