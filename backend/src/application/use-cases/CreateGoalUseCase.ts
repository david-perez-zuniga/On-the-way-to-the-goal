import { Goal } from '../../domain/entities/Goal';
import { type IGoalRepository } from '../../domain/repositories/IGoalRepository';
import { Prisma } from '../../infrastructure/db';

// Contrato para crear un Goal
export interface CreateGoalDTO {
  title: string;
  totalAmount: number;
  currency: string;
  userId: string;
}

// Metodo de creación de Goal
export class CreateGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  public async execute(data: CreateGoalDTO): Promise<Goal> {
    const createdAt = new Date();
    const updatedAt = new Date();
    const id = crypto.randomUUID();
    const finishedAt = null;

    const newGoal = new Goal(
      id,
      data.title,
      new Prisma.Decimal(data.totalAmount),
      data.currency,
      data.userId,
      createdAt,
      updatedAt,
      finishedAt
    )
    await this.goalRepository.create(newGoal)
    return newGoal
  }
}
