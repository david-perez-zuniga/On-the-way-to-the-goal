import { apiRequest } from '../../../services/httpClient'
import type { CreateUserDTO, UserResponse } from '../types'

export async function createUser(data: CreateUserDTO): Promise<UserResponse> {
  return apiRequest<UserResponse>('/api/users', {
    method: 'POST',
    body: data,
    authenticated: false,
  })
}
