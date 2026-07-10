import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET ?? 'SECRETO'

export interface JWTPayload {
  userId: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization
    if (!header) {
      res.status(401).json({ error: 'Token no proporcionado' })
      return
    }

    const token = header.replace('Bearer ', '')
    if (!token) {
      res.status(401).json({ error: 'Token no proporcionado' })
      return
    }

    const payload = jwt.verify(token, JWT_SECRET) as JWTPayload
    req.user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' })
  }
}
