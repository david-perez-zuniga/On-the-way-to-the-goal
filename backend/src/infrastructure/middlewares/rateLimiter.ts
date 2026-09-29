import { type Request, type Response, type NextFunction } from 'express'
/**
 * Dependency-free in-memory rate limiter.
 *
 * Added without introducing a new package, to keep the project's dependency surface
 * unchanged. Suitable for a single-process deployment; a multi-instance deployment needs a
 * shared store, which is noted as a known limitation rather than silently ignored.
 */

export interface RateLimitOptions {
  /** Maximum requests allowed inside the window. */
  max: number
  /** Window length in milliseconds. */
  windowMs: number
  /** Bucket key. Defaults to the client IP. */
  keyGenerator?: (req: Request) => string
}

export function rateLimit(options: RateLimitOptions) {
  const { max, windowMs, keyGenerator } = options
  const hits = new Map<string, number[]>()

  // Bound memory: drop expired buckets periodically rather than growing without limit.
  const sweep = setInterval(() => {
    const now = Date.now()
    for (const [key, timestamps] of hits) {
      const live = timestamps.filter((t) => now - t < windowMs)
      if (live.length === 0) hits.delete(key)
      else hits.set(key, live)
    }
  }, windowMs)
  sweep.unref?.()

  const resolveKey =
    keyGenerator ??
    ((req: Request) => req.ip ?? req.socket.remoteAddress ?? 'unknown')

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): void {
    const now = Date.now()
    const key = resolveKey(req)
    const timestamps = (hits.get(key) ?? []).filter((t) => now - t < windowMs)

    if (timestamps.length >= max) {
      // `noUncheckedIndexedAccess` is on, so the oldest entry is not assumed to exist.
      // It must, because length >= max and max >= 1, but the guard is explicit rather than
      // asserted.
      const oldest = timestamps[0]
      const retryAfterSeconds =
        oldest === undefined
          ? Math.max(1, Math.ceil(windowMs / 1000))
          : Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000))
      res.setHeader('Retry-After', String(retryAfterSeconds))
      res.status(429).json({
        error: 'Demasiados intentos. Inténtalo de nuevo más tarde.',
        code: 'RATE_LIMITED',
        retryAfter: retryAfterSeconds,
      })
      return
    }

    timestamps.push(now)
    hits.set(key, timestamps)
    next()
  }
}

/** Rejects a rate-limit key that is absent or absurdly long, so an attacker cannot use
 *  oversized bodies to inflate the in-memory bucket table. */
export function safeKeyPart(value: unknown): string {
  return typeof value === 'string' && value.length <= 254 ? value : 'invalid'
}
