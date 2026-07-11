export interface GoalProgress {
  id: string
  title: string
  totalAmount: number
  currency: string
  currentAmount: number
  percentage: number
  createdAt: string
  updatedAt: string
  finishedAt: string | null
}

export interface CreateGoalDTO {
  title: string
  totalAmount: number
  currency: string
}
