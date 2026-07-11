import { apiRequest } from '../../../services/httpClient'
import type { GoalProgress, CreateGoalDTO } from '../types'

export async function fetchUserGoals(): Promise<GoalProgress[]> {
  return apiRequest<GoalProgress[]>('/api/goals')
}

export async function createGoal(data: CreateGoalDTO): Promise<void> {
  await apiRequest('/api/goals', {
    method: 'POST',
    body: data,
  })
}
