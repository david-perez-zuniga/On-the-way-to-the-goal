import { Prisma } from "../db";
import { prisma } from "../db/prisma";
import { type IUserRepository } from "../../domain/repositories/IUserRepository";
import { User } from "../../domain/entities/User";

// Mapeo de los atributos de los models
export class PrismaUserRepository implements IUserRepository {

  public async create(user: User): Promise<void> {
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        password: user.password,
        createdAt: user.createdAt
      }      
    });
  }

  // Método para buscar por id
  public async findById(id: string): Promise<User | null> {
    throw new Error('Método no implementado aún');
  }

  // Método para obtener todos
  public async findAll(id: string): Promise<User[]>{
    throw new Error('Método no implementado aún');
  }
}
