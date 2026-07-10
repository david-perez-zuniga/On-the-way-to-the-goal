import { apiRequest } from '../../../services/httpClient'
import type { GoalProgress } from '../types'

export async function fetchUserGoals(): Promise<GoalProgress[]> {
  return apiRequest<GoalProgress[]>('/api/goals')
}
