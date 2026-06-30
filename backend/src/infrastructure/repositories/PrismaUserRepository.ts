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

  public async findByEmail(email: string): Promise<User | null> {
      const emailUserPrisma = await prisma.user.findUnique({
        where: {
          email: email
        }
      })
      if (emailUserPrisma == null){
        return null
      }
      const gotUserEmail = new User(
        emailUserPrisma.id,
        emailUserPrisma.email,
        emailUserPrisma.password,
        emailUserPrisma.createdAt
      )
      return gotUserEmail
    }
}
