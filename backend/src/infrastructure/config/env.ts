/**
 * Environment configuration.
 *
 * Centralised so that a security-critical value cannot silently fall back to a hardcoded
 * default in more than one place. Previously both the auth middleware and the login use
 * case independently fell back to the literal string 'SECRETO' when JWT_SECRET was unset,
 * which would make every deployment share a publicly known signing key.
 */

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ConfigurationError'
  }
}

let cachedSecret: string | null = null

/**
 * Returns the JWT signing secret, or throws if it is absent or obviously unusable.
 * Fails closed: refusing to start is the only safe response to a missing secret.
 */
export function getJwtSecret(): string {
  if (cachedSecret !== null) return cachedSecret

  const secret = process.env.JWT_SECRET
  if (secret === undefined || secret.trim() === '') {
    throw new ConfigurationError(
      'JWT_SECRET no está definido. El servidor no puede arrancar con una clave de firma ausente.',
    )
  }
  if (secret === 'SECRETO' || secret.length < 32) {
    throw new ConfigurationError(
      'JWT_SECRET es débil o conocida. Debe ser una cadena aleatoria de al menos 32 caracteres.',
    )
  }

  cachedSecret = secret
  return cachedSecret
}

/**
 * Boot-time gate. Throws on a critical misconfiguration so the process exits immediately
 * with a clear message, instead of starting and failing on every individual request.
 */
export function assertCriticalConfiguration(): void {
  getJwtSecret()
}
