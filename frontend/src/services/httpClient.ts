const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

const TOKEN_KEY = 'auth_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return getToken() !== null
}

interface RequestOptions {
  method?: string
  body?: unknown
  headers?: Record<string, string>
  authenticated?: boolean
}

export async function apiRequest<T = unknown>(
  path: string,
  { method = 'GET', body, headers = {}, authenticated = true }: RequestOptions = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  }

  if (authenticated) {
    const token = getToken()
    if (token) {
      reqHeaders['Authorization'] = `Bearer ${token}`
    }
  }

  const res = await fetch(url, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (res.status === 401) {
    clearToken()
    window.location.href = '/iniciar-sesion'
    throw new Error('Sesión expirada')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error del servidor' }))
    throw new Error(err.error ?? `Error ${res.status}`)
  }

  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}
