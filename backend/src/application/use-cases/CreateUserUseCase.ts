import { User } from '../../domain/entities/User'
import { type IUserRepository } from '../../domain/repositories/IUserRepository'

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
    
    const newUser = new User(
      id,
      data.email,
      data.password,
      createdAt
    )
    await this.userRepository.create(newUser)
    return newUser
  }
}
