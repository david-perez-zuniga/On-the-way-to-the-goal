import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getJwtSecret, ConfigurationError } from '../config/env'
import { UnauthorizedError } from '../../domain/errors/AppError'

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

/** RFC 6750 section 2.1: the credentials parameter is the literal string "Bearer " followed
 *  by the token. The scheme must be present and exact. */
const BEARER_PREFIX = /^Bearer[ \t]+(.+)$/i

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const header = req.headers.authorization
    if (!header || typeof header !== 'string') {
      throw new UnauthorizedError('Token no proporcionado')
    }

    // Previously `header.replace('Bearer ', '')` ignored the scheme entirely, so a raw
    // token with no prefix authenticated, and any other prefix was left attached to the
    // token and failed verification. The scheme is now required and validated.
    const match = BEARER_PREFIX.exec(header.trim())
    if (!match) {
      throw new UnauthorizedError('Esquema de autorización inválido')
    }

    const token = match[1]
    if (!token || token.length > 4096) {
      throw new UnauthorizedError('Token no proporcionado')
    }

    const payload = jwt.verify(token, getJwtSecret()) as JWTPayload

    if (typeof payload?.userId !== 'string' || payload.userId.length === 0) {
      throw new UnauthorizedError('Token inválido o expirado')
    }

    req.user = payload
    next()
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      res.status(401).json({ error: error.message, code: error.code })
      return
    }

    // A configuration fault must not be reported to the caller as "unauthorized". Doing so
    // would make a broken JWT_SECRET look like a fleet of invalid credentials: every
    // authenticated request would answer 401, clients would conclude their tokens were
    // bad, and monitoring would see no server fault at all. This is the same
    // outage-masking mistake that used to collapse every login error into a 401.
    if (error instanceof ConfigurationError) {
      next(error)
      return
    }

    // An invalid signature or an expired token. Never leaked verbatim to the client.
    res.status(401).json({ error: 'Token inválido o expirado', code: 'UNAUTHORIZED' })
  }
}
