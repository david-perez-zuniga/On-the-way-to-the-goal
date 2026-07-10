export interface CreateUserDTO {
  email: string
  password: string
}

export interface UserResponse {
  id: string
  email: string
  createdAt: string
}
