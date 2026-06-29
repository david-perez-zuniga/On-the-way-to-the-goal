import { User } from '../../domain/entities/User'
import { type IUserRepository } from '../../domain/repositories/IUserRepository'
import bcrypt from 'bcrypt'

// Contrato para crear un User
export interface CreateUserDTO{
  email: string;
  password: string;  
}

// Método para creación de User
export class CreateUserCase{
  constructor(private readonly userRepository: IUserRepository){}

  public async execute(data: CreateUserDTO): Promise<User> {
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
    await this.userRepository.create(newUser)
    return newUser
  }
}
