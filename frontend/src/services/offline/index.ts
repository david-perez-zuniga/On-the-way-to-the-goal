import { registerHandler, matchHandler } from './handlers'
import * as store from './store'
import { createFakeToken, decodeFakeToken } from './jwt'

export { matchHandler }

let _simulationMode = false

export function isSimulationMode(): boolean {
  return _simulationMode
}

export function setSimulationMode(v: boolean): void {
  _simulationMode = v
}

function extractUserId(headers: Record<string, string>): string | null {
  const auth = headers['Authorization'] ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return null
  const payload = decodeFakeToken(token)
  return payload?.userId ?? null
}

registerHandler('POST', '/api/login', (body) => {
  const { email, password } = body as { email: string; password: string }
  const user = store.findUserByEmail(email)
  if (!user || user.password !== password) {
    throw new Error('Credenciales inválidas')
  }
  const token = createFakeToken(user.id, user.email)
  return { token }
})

registerHandler('POST', '/api/users', (body) => {
  const { email, password } = body as { email: string; password: string }
  const existing = store.findUserByEmail(email)
  if (existing) {
    throw new Error('El usuario ya existe')
  }
  store.createUser(email, password)
  return { message: 'Usuario creado exitosamente' }
})

registerHandler('GET', '/api/goals', (_, headers) => {
  const userId = extractUserId(headers)
  if (!userId) throw new Error('Usuario no autenticado')
  const goals = store.getGoalsByUser(userId)
  return goals.map((g) => {
    const total = g.totalAmount
    const current = g.currentAmount
    const percentage = total > 0 ? Math.round((current / total) * 10000) / 100 : 0
    return {
      id: g.id,
      title: g.title,
      totalAmount: total,
      currency: g.currency,
      currentAmount: current,
      percentage,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
      finishedAt: g.finishedAt,
    }
  })
})

registerHandler('POST', '/api/goals', (body, headers) => {
  const userId = extractUserId(headers)
  if (!userId) throw new Error('Usuario no autenticado')
  const { title, totalAmount, currency } = body as {
    title: string
    totalAmount: number
    currency: 'USD' | 'NIO'
  }
  const goal = store.createGoal(userId, title, totalAmount, currency)
  return {
    id: goal.id,
    title: goal.title,
    totalAmount: goal.totalAmount,
    currency: goal.currency,
    userId: goal.userId,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
    finishedAt: goal.finishedAt,
  }
})

registerHandler('PUT', '/api/goals/:id', (body, _headers, params) => {
  const { title, totalAmount, currency, createdAt, finishedAt } = body as {
    title: string
    totalAmount: number
    currency: 'USD' | 'NIO'
    createdAt: string
    finishedAt: string | null
  }
  const updated = store.updateGoal(params.id, { title, totalAmount, currency, createdAt, finishedAt })
  if (!updated) throw new Error('Meta no encontrada')
  return {
    id: updated.id,
    title: updated.title,
    totalAmount: updated.totalAmount,
    currency: updated.currency,
    userId: updated.userId,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    finishedAt: updated.finishedAt,
  }
})

registerHandler('DELETE', '/api/goals/:id', (_body, _headers, params) => {
  const ok = store.deleteGoal(params.id)
  if (!ok) throw new Error('Meta no encontrada')
  return undefined
})

registerHandler('POST', '/api/payment', (body) => {
  const { goalId, deposit, currency } = body as {
    goalId: string
    deposit: number
    currency: string
  }
  const payment = store.createPayment(goalId, deposit, currency)
  if (!payment) throw new Error('Meta no encontrada')
  return {
    id: payment.id,
    deposit: payment.deposit,
    depositDate: payment.depositDate,
    currency: payment.currency,
    goalId: payment.goalId,
  }
})

registerHandler('GET', '/api/payment/goal/:goalId', (_body, _headers, params) => {
  const payments = store.getPaymentsByGoal(params.goalId)
  return payments.map((p) => ({
    id: p.id,
    deposit: p.deposit,
    depositDate: p.depositDate,
    currency: p.currency,
    goalId: p.goalId,
  }))
})

registerHandler('GET', '/api/health', () => {
  return { status: 'ok' }
})
