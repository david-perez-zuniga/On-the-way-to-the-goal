import { User, type UserView, toUserView } from '../../domain/entities/User'
import { type IUserRepository } from '../../domain/repositories/IUserRepository'
import { ConflictError } from '../../domain/errors/AppError'
import bcrypt from 'bcrypt'

// Contrato para crear un User
export interface CreateUserDTO{
  email: string;
  password: string;  
}

// Método para creación de User
export class CreateUserCase{
  constructor(private readonly userRepository: IUserRepository){}

  public async execute(data: CreateUserDTO): Promise<UserView> {
    const id = crypto.randomUUID();
    const createdAt = new Date();
    const saltRounds = 10;
    
    const passwordhash = await bcrypt.hash(data.password, saltRounds);
    
    const newUser = new User(
      id,
      data.email,
      passwordhash,
      createdAt
    )

    // The unique constraint on `email` is the authority on duplicates. Translating the
    // driver error here keeps the controller free of persistence concerns and lets the
    // global handler answer 409 instead of leaking a 500.
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing !== null) {
      throw new ConflictError('Ya existe un usuario registrado con ese email')
    }

    try {
      await this.userRepository.create(newUser)
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        throw new ConflictError('Ya existe un usuario registrado con ese email')
      }
      throw error
    }

    // Returns the projection, not the entity: the bcrypt hash must never leave the server.
    return toUserView(newUser)
  }
}
