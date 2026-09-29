import { Goal } from '../entities/Goal';

// Métodos para crear, encontrar y mostrar Goals
//
// Every read, update and delete is scoped to an owner. An unscoped lookup by primary key
// alone is what allowed one authenticated user to read, rewrite, transfer or delete
// another user's savings goal. The owner is a required argument, not an optional filter,
// so a new call site cannot accidentally reintroduce the hole.
export interface IGoalRepository {
  create(goal: Goal): Promise<void>;
  /** Scoped by both id and owner. */
  findById(id: string, userId: string): Promise<Goal | null>;
  findAll(userId: string): Promise<Goal[]>;
  /** Scoped by id and owner, and never writes `userId`, so ownership cannot be transferred. */
  update(goal: Goal, userId: string): Promise<void>;
  /** Scoped by id and owner. */
  delete(id: string, userId: string): Promise<void>;
}
