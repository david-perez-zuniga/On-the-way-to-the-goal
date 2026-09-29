import request from 'supertest'
import { createApp } from '../src/app'
import { prisma } from '../src/infrastructure/db/prisma'
import { resetRateLimits } from '../src/infrastructure/middlewares/rateLimiter'

/**
 * Shared helpers for the HTTP suite.
 *
 * The tests drive the real application object with the real middleware chain, the real
 * repositories and a real Postgres. Nothing is mocked: a mocked authorization check proves
 * only that the mock is correct, which is exactly the class of bug this suite exists to
 * catch.
 */

const app = createApp()

export const PASSWORD = 'Str0ng!Passw0rd'

let counter = 0
/** Unique per call, so tests never collide on the unique email index. */
export function uniqueEmail(prefix = 'user'): string {
  counter += 1
  return `${prefix}.${process.pid}.${Date.now()}.${counter}@example.com`
}

export interface RegisteredUser {
  id: string
  email: string
  token: string
  password: string
}

/** Registers a user, then logs in and returns both the id and a usable bearer token. */
export async function registerAndLogin(prefix = 'user'): Promise<RegisteredUser> {
  const email = uniqueEmail(prefix)
  const password = PASSWORD

  const created = await request(app)
    .post('/api/users')
    .send({ email, password, passwordConfirmation: password })
  if (created.status !== 201) {
    throw new Error(`register failed: ${created.status} ${JSON.stringify(created.body)}`)
  }

  const token = await login(email, password)
  return { id: created.body.id, email, token, password }
}

export async function login(email: string, password = PASSWORD): Promise<string> {
  const res = await request(app).post('/api/login').send({ email, password })
  if (res.status !== 200) {
    throw new Error(`login failed: ${res.status} ${JSON.stringify(res.body)}`)
  }
  return res.body.token as string
}

export interface GoalFixture {
  id: string
  title: string
  totalAmount: number
  currency: string
}

export async function createGoal(
  token: string,
  overrides: Partial<{ title: string; totalAmount: number; currency: string }> = {},
): Promise<GoalFixture> {
  const res = await request(app)
    .post('/api/goals')
    .set('Authorization', `Bearer ${token}`)
    .send({
      title: 'Meta de prueba',
      totalAmount: 500,
      currency: 'USD',
      ...overrides,
    })
  if (res.status !== 201) {
    throw new Error(`createGoal failed: ${res.status} ${JSON.stringify(res.body)}`)
  }
  return res.body as GoalFixture
}

/** Empties every table and clears the in-memory rate-limit counters. */
export async function resetState(): Promise<void> {
  resetRateLimits()
  // Child tables first: a TRUNCATE of User cascades anyway, but being explicit keeps the
  // intent obvious and the statement valid if the schema ever changes.
  await prisma.$executeRawUnsafe('TRUNCATE "Payment", "Goal", "User" CASCADE')
}

/** Closes the pool so the test process can exit cleanly. */
export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect()
}

export { app, prisma }
