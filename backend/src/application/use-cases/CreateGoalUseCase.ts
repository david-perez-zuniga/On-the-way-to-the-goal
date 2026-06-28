import { Goal } from '../../domain/entities/Goal';
import { type IGoalRepository } from '../../domain/repositories/IGoalRepository';

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
    const currentAmount = 0;
    const finishedAt = null;

    const newGoal = new Goal(
      id,
      data.title,
      data.totalAmount,
      currentAmount,
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
