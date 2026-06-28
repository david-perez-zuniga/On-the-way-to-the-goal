import { PrismaClient, Prisma } from '@prisma/client';
import { type IGoalRepository } from '../../domain/repositories/IGoalRepository';
import { Goal } from '../../domain/entities/Goal';

// Instanciamos el cliente de Prisma
const prisma = new PrismaClient();

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

  // Dejamos estos pendientes para la próxima fase, pero debemos declararlos 
  // para cumplir con el contrato de la interfaz.
  public async findById(id: string): Promise<Goal | null> {
    throw new Error('Método no implementado aún.');
  }

  public async findAll(userId: string): Promise<Goal[]> {
    throw new Error('Método no implementado aún.');
  }
}
