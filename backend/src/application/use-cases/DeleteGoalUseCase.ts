import { type IGoalRepository } from '../../domain/repositories/IGoalRepository';

export interface DeleteGoalDTO {
  id: string;
  /** Owner taken from the verified token. The repository scopes the delete by it. */
  userId: string;
}

export class DeleteGoalUseCase {
  constructor(private readonly goalRepository: IGoalRepository) {}

  public async execute(data: DeleteGoalDTO): Promise<void> {
    await this.goalRepository.delete(data.id, data.userId);
  }
}
