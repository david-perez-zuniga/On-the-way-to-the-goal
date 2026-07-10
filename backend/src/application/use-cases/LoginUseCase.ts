import { type IUserRepository } from "../../domain/repositories/IUserRepository";
import bcrypt from 'bcrypt'
import jwt from "jsonwebtoken"

export interface LoginUserDTO{
  email: string;
  password: string;
}

export class LoginUseCase{
  constructor(private readonly userRepository: IUserRepository){}

  public async execute(data: LoginUserDTO): Promise<string>{
    const user = await this.userRepository.findByEmail(data.email);

    if (user === null){
      throw new Error('Credenciales incorrectas')
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password)
    if (isPasswordValid == false){
      throw new Error('Credenciales incorrectas')
    }

    const JWT_SECRET = process.env.JWT_SECRET ?? 'SECRETO'
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30min' })

    return token
    
  }
}
