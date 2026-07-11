export interface SimUser {
  id: string
  email: string
  password: string
}

export interface SimGoal {
  id: string
  userId: string
  title: string
  totalAmount: number
  currency: 'USD' | 'NIO'
  currentAmount: number
  createdAt: string
  updatedAt: string
  finishedAt: string | null
}

export interface SimPayment {
  id: string
  goalId: string
  deposit: number
  currency: string
  depositDate: string
}
