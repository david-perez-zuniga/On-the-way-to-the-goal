import { Goal } from '../entities/Goal';

// Métodos para crear, encontrar y mostrar Goals
export interface IGoalRepository {
  create(goal: Goal): Promise<void>;
  findById(id: string): Promise<Goal | null>;
  findAll(userId: string): Promise<Goal[]>;
  update(goal: Goal): Promise<void>;
}
