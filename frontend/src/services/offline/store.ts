import type { SimUser, SimGoal, SimPayment } from './types'

const STORE_KEY = 'offline_data'

interface Store {
  users: SimUser[]
  goals: SimGoal[]
  payments: SimPayment[]
}

function getStore(): Store {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  const empty: Store = { users: [], goals: [], payments: [] }
  saveStore(empty)
  return empty
}

function saveStore(store: Store): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store))
  } catch {}
}

function uid(): string {
  return crypto.randomUUID()
}

export function createUser(email: string, password: string): SimUser {
  const store = getStore()
  const user: SimUser = { id: uid(), email, password }
  store.users.push(user)
  saveStore(store)
  return user
}

export function findUserByEmail(email: string): SimUser | undefined {
  const store = getStore()
  return store.users.find((u) => u.email === email)
}

export function getGoalsByUser(userId: string): SimGoal[] {
  const store = getStore()
  return store.goals.filter((g) => g.userId === userId)
}

export function getGoalById(id: string): SimGoal | undefined {
  const store = getStore()
  return store.goals.find((g) => g.id === id)
}

export function createGoal(
  userId: string,
  title: string,
  totalAmount: number,
  currency: 'USD' | 'NIO',
): SimGoal {
  const store = getStore()
  const now = new Date().toISOString()
  const goal: SimGoal = {
    id: uid(),
    userId,
    title,
    totalAmount,
    currency,
    currentAmount: 0,
    createdAt: now,
    updatedAt: now,
    finishedAt: null,
  }
  store.goals.push(goal)
  saveStore(store)
  return goal
}

export function updateGoal(
  id: string,
  data: { title?: string; totalAmount?: number; currency?: 'USD' | 'NIO'; createdAt?: string; finishedAt?: string | null },
): SimGoal | undefined {
  const store = getStore()
  const idx = store.goals.findIndex((g) => g.id === id)
  if (idx === -1) return undefined
  const goal = store.goals[idx]
  const updated: SimGoal = {
    ...goal,
    title: data.title ?? goal.title,
    totalAmount: data.totalAmount ?? goal.totalAmount,
    currency: data.currency ?? goal.currency,
    createdAt: data.createdAt ?? goal.createdAt,
    finishedAt: data.finishedAt !== undefined ? data.finishedAt : goal.finishedAt,
    updatedAt: new Date().toISOString(),
  }
  store.goals[idx] = updated
  saveStore(store)
  return updated
}

export function deleteGoal(id: string): boolean {
  const store = getStore()
  const found = store.goals.some((g) => g.id === id)
  if (!found) return false
  store.goals = store.goals.filter((g) => g.id !== id)
  store.payments = store.payments.filter((p) => p.goalId !== id)
  saveStore(store)
  return true
}

export function getPaymentsByGoal(goalId: string): SimPayment[] {
  const store = getStore()
  return store.payments.filter((p) => p.goalId === goalId)
}

export function createPayment(goalId: string, deposit: number, currency: string): SimPayment | undefined {
  const store = getStore()
  const idx = store.goals.findIndex((g) => g.id === goalId)
  if (idx === -1) return undefined
  const payment: SimPayment = {
    id: uid(),
    goalId,
    deposit,
    currency,
    depositDate: new Date().toISOString(),
  }
  store.payments.push(payment)
  store.goals[idx].currentAmount += deposit
  store.goals[idx].updatedAt = new Date().toISOString()
  saveStore(store)
  return payment
}
