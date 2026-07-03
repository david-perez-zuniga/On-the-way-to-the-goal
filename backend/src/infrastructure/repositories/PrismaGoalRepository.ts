import { Prisma } from '../db';
import { prisma } from '../db/prisma';
import { type IGoalRepository } from '../../domain/repositories/IGoalRepository';
import { Goal } from '../../domain/entities/Goal';

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

  public async findById(id: string): Promise<Goal | null> {
    throw new Error('Método no implementado aún.');
  }

  public async findAll(userId: string): Promise<Goal[]> {
    const userGoals = await prisma.goal.findMany({
      where: {
        userId: userId,
      }
    });
    if (userGoals == null){
      return []
    }
    const gotUserGoals = userGoals.map(g =>{
      return new Goal(
      g.id,
      g.title,
      g.totalAmount,
      g.currency,
      g.userId,
      g.createdAt,
      g.updatedAt,
      g.finishedAt)
    });
    return gotUserGoals;
  }

  public async update(goal: Goal): Promise<void> {
      await prisma.goal.update({
        where: {
          id: goal.id,
        },
        data: {
          title: goal.title,
          totalAmount: goal.totalAmount,
          currency: goal.currency,
          createdAt: goal.createdAt,
          updateAt: goal.updatedAt,
          finishedAt: goal.finishedAt,
          userId: goal.userId
        }
      });
  }

  public async delete(id: string): Promise<void>{
    await prisma.goal.delete({
      where: {
        id: id,
      }
    });
  }
}
