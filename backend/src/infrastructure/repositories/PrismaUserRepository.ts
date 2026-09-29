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
  //
  // Not implemented. A raw `Error` here would have reached the global handler as an
  // unmapped fault and been reported as a 500, which is exactly the client-blame-a-server
  // confusion this audit removed. An unimplemented repository method is a programming
  // error, so it is reported as one: the detail is logged server-side and the client
  // receives an opaque 500.
  public async findById(_id: string): Promise<User | null> {
    throw new Error('PrismaUserRepository.findById no está implementado')
  }

  // Método para obtener todos
  public async findAll(_id: string): Promise<User[]>{
    throw new Error('PrismaUserRepository.findAll no está implementado')
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
