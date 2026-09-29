import { ValidationError } from '../errors/AppError'

// Contrato del modelo User
export class User{
  constructor(
    public readonly id: string,
    public email: string,
    public readonly password: string,
    public readonly createdAt: Date
  )
  {
    if (typeof email !== 'string' || !email.includes('@')){
      throw new ValidationError('Formato de email incorrecto', 'email')
    }
  }
}

/**
 * Public projection of a user. Never serialise a `User` directly: `password` holds the
 * bcrypt hash and returning it to the client leaks credential material.
 */
export interface UserView {
  id: string
  email: string
  createdAt: Date
}

export function toUserView(user: User): UserView {
  return { id: user.id, email: user.email, createdAt: user.createdAt }
}
