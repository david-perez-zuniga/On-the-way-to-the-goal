import { Prisma } from '../db';
import { prisma } from '../db/prisma';
import { type IGoalRepository } from '../../domain/repositories/IGoalRepository';
import { Goal } from '../../domain/entities/Goal';
import { NotFoundError } from '../../domain/errors/AppError';
import { toGoal } from './goalMapper';

export class PrismaGoalRepository implements IGoalRepository {

  public async create(goal: Goal): Promise<void> {
    await prisma.goal.create({
      data: {
        id: goal.id,
        title: goal.title,
        totalAmount: new Prisma.Decimal(goal.totalAmount),
        currency: goal.currency,
        userId: goal.userId,
        createdAt: goal.createdAt,
        updatedAt: goal.updatedAt,
        finishedAt: goal.finishedAt
      }
    });
  }

  /**
   * Ownership is enforced in the WHERE clause, not by filtering after the fetch. Prisma's
   * `updateMany`/`deleteMany` exist for exactly this reason: `update` and `delete` can only
   * target a unique column, so scoping them by owner through those methods would have
   * required a read followed by a write, reintroducing a check-then-act race. The count of
   * affected rows is the authority for "did I own it".
   */
  public async findById(idGoal: string, userId: string): Promise<Goal | null> {
    const record = await prisma.goal.findFirst({
      where: { id: idGoal, userId },
    });

    if (record == null) {
      return null;
    }
    return toGoal(record);
  }

  public async findAll(userId: string): Promise<Goal[]> {
    const userGoals = await prisma.goal.findMany({
      where: { userId },
    });

    // One row that violates an invariant must not make the whole collection unreadable.
    // Rows are re-validated on the way out through the entity, so a row written by an older
    // build (before validation existed) is skipped instead of faulting the entire endpoint.
    const goals: Goal[] = [];
    for (const record of userGoals) {
      try {
        goals.push(toGoal(record));
      } catch (error) {
        console.warn(
          `[data-integrity] goal ${record.id} violates an invariant and was omitted: ${
            (error as Error)?.message
          }`,
        );
      }
    }
    return goals;
  }

  public async update(goal: Goal, userId: string): Promise<void> {
    // `userId` is deliberately absent from `data`: a caller must never be able to move a
    // goal to a different account. The owner's id is used only as a filter.
    const { count } = await prisma.goal.updateMany({
      where: { id: goal.id, userId },
      data: {
        title: goal.title,
        totalAmount: goal.totalAmount,
        currency: goal.currency,
        updatedAt: goal.updatedAt,
        finishedAt: goal.finishedAt,
      },
    });

    if (count === 0) {
      throw new NotFoundError('Meta no encontrada');
    }
  }

  public async delete(id: string, userId: string): Promise<void> {
    // Both statements are scoped to the owner and run in one transaction, so payments can
    // never be removed for a goal the caller does not own, and no partial delete can occur.
    // Payment rows are matched through their parent goal, so the ownership filter is applied
    // to the goal relationship rather than trusted from the caller's id.
    const [, goalResult] = await prisma.$transaction([
      prisma.payment.deleteMany({ where: { goalId: id, goal: { userId } } }),
      prisma.goal.deleteMany({ where: { id, userId } }),
    ]);

    if (goalResult.count === 0) {
      throw new NotFoundError('Meta no encontrada');
    }
  }
}
