import { type IUserRepository } from "../../domain/repositories/IUserRepository";
import { UnauthorizedError } from '../../domain/errors/AppError';
import { getJwtSecret } from '../../infrastructure/config/env';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export interface LoginUserDTO{
  email: string;
  password: string;
}

/** A fixed, valid bcrypt hash of a value nobody knows. Comparing against it when the
 *  account does not exist makes the "unknown email" path cost the same as the "wrong
 *  password" path, closing the timing oracle that would otherwise let an attacker
 *  enumerate registered accounts. */
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

export class LoginUseCase{
  constructor(private readonly userRepository: IUserRepository){}

  public async execute(data: LoginUserDTO): Promise<string>{
    const user = await this.userRepository.findByEmail(data.email);

    if (user === null){
      // Spend comparable time before failing so the response cannot be used to
      // distinguish "no such account" from "wrong password".
      await bcrypt.compare(data.password, DUMMY_HASH).catch(() => false)
      throw new UnauthorizedError()
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password)
    if (!isPasswordValid){
      throw new UnauthorizedError()
    }

    // Throws ConfigurationError if JWT_SECRET is missing or weak, which the global
    // handler reports as a server fault. It is never downgraded to a 401, so a
    // misconfigured deployment cannot masquerade as ordinary bad credentials.
    return jwt.sign({ userId: user.id }, getJwtSecret(), { expiresIn: '30min' })
  }
}
