import { type ErrorRequestHandler, type Request, type Response, type NextFunction } from 'express'
import { AppError, ValidationError, NotFoundError, ConflictError, ForbiddenError, UnauthorizedError } from '../../domain/errors/AppError'

/**
 * Global error handler.
 *
 * This is the last line of defence that guarantees the "Zero 5XX" contract: anything that
 * reaches here is translated into a controlled 4XX whenever its cause is attributable to the
 * client. Only genuinely unexpected faults are allowed to become a 500, and even then the
 * response body never contains a stack trace or driver detail.
 *
 * It also fixes a secondary defect: client-caused errors used to be written to stdout via
 * `console.error` in every controller, so hostile input produced unbounded log noise.
 */

interface MappedStatus {
  status: number
  body: Record<string, unknown>
}

/** Prisma exposes a stable, documented `code` on request errors. Matching on the code
 *  rather than importing a version-specific error class keeps this resilient. */
function mapPrismaError(error: unknown): MappedStatus | null {
  const code = (error as { code?: unknown } | null)?.code
  if (typeof code !== 'string' || !code.startsWith('P')) return null

  switch (code) {
    // Unique constraint failed, e.g. a duplicate email.
    case 'P2002':
      return {
        status: 409,
        body: { error: 'El recurso ya existe', code: 'CONFLICT' },
      }
    // An operation required a record that does not exist.
    case 'P2025':
      return {
        status: 404,
        body: { error: 'Recurso no encontrado', code: 'NOT_FOUND' },
      }
    // Foreign key constraint failed: a referenced id does not exist.
    case 'P2003':
      return {
        status: 400,
        body: { error: 'Referencia a un recurso inexistente', code: 'VALIDATION_ERROR' },
      }
    // The value cannot be represented by the database column, e.g. Decimal overflow.
    case 'P2020':
      return {
        status: 400,
        body: {
          error: 'Uno de los valores enviados está fuera del rango permitido',
          code: 'VALIDATION_ERROR',
        },
      }
    default:
      // Any other Prisma request error is a client-caused contract violation.
      return {
        status: 400,
        body: { error: 'La petición no cumple el contrato esperado', code: 'BAD_REQUEST' },
      }
  }
}

/** `express.json()` throws a SyntaxError with a `status` for malformed JSON bodies. */
function mapBodyParserError(error: unknown): MappedStatus | null {
  const err = error as { type?: string; status?: number; message?: string } | null
  if (!err) return null

  if (err.type === 'entity.too.large') {
    return {
      status: 413,
      body: { error: 'El cuerpo de la petición excede el tamaño permitido', code: 'PAYLOAD_TOO_LARGE' },
    }
  }
  if (err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err)) {
    return {
      status: 400,
      body: { error: 'El cuerpo de la petición no es JSON válido', code: 'MALFORMED_JSON' },
    }
  }
  return null
}

function mapDomainError(error: AppError): MappedStatus {
  if (error instanceof ValidationError) {
    return {
      status: 422,
      body: { error: error.message, code: error.code, field: error.field },
    }
  }
  if (error instanceof NotFoundError) {
    return { status: 404, body: { error: error.message, code: error.code } }
  }
  if (error instanceof UnauthorizedError) {
    return { status: 401, body: { error: error.message, code: error.code } }
  }
  if (error instanceof ForbiddenError) {
    // Deliberately 404 rather than 403: a 403 would confirm that the resource exists.
    return { status: 404, body: { error: 'Recurso no encontrado', code: error.code } }
  }
  if (error instanceof ConflictError) {
    return { status: 409, body: { error: error.message, code: error.code } }
  }
  return { status: 400, body: { error: error.message, code: error.code } }
}

/** Errors that are the caller's fault, not the server's. Never logged, never a 5XX. */
const CLIENT_ATTRIBUTABLE: ReadonlySet<number> = new Set([400, 401, 403, 404, 409, 413, 422])

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(error)
    return
  }

  const mapped: MappedStatus | null =
    error instanceof AppError
      ? mapDomainError(error)
      : (mapBodyParserError(error) ?? mapPrismaError(error))

  if (mapped) {
    // Client-caused errors are deliberately NOT logged. Logging them is what allowed a
    // single hostile request stream to flood stdout with stack traces.
    res.status(mapped.status).json(mapped.body)
    return
  }

  // Genuinely unexpected: log server-side with full detail, return an opaque body.
  console.error('[unhandled]', error)
  res.status(500).json({ error: 'Error interno del servidor', code: 'INTERNAL_ERROR' })
}

/** Terminal 404 for unmatched routes, so an unknown path is a clean 4XX instead of the
 *  default Express HTML 404 page. Registered after all routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND' })
}

export { CLIENT_ATTRIBUTABLE }
