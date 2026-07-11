export function createFakeToken(userId: string, email: string): string {
  const payload = { userId, email, iat: Date.now() }
  return btoa(JSON.stringify(payload))
}

export function decodeFakeToken(token: string): { userId: string; email: string } | null {
  try {
    return JSON.parse(atob(token))
  } catch {
    return null
  }
}
