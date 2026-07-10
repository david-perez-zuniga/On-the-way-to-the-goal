import { apiRequest, setToken, clearToken, isAuthenticated, getToken } from './httpClient'

export interface LoginResponse {
  token: string
}

export interface RegisterData {
  email: string
  password: string
}

export async function login(email: string, password: string): Promise<void> {
  const data = await apiRequest<LoginResponse>('/api/login', {
    method: 'POST',
    body: { email, password },
    authenticated: false,
  })
  setToken(data.token)
}

export async function register(data: RegisterData): Promise<void> {
  await apiRequest('/api/users', {
    method: 'POST',
    body: data,
    authenticated: false,
  })
}

export function logout(): void {
  clearToken()
  window.location.href = '/iniciar-sesion'
}

export { isAuthenticated, getToken }
