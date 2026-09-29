import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app, registerAndLogin, createGoal, closeDatabase, PASSWORD } from './helpers'
import { uniqueEmail } from './helpers'

describe('smoke: the harness really exercises the app', () => {
  beforeAll(() => {
    expect(app).toBeDefined()
  })

  afterAll(closeDatabase)

  it('answers the health check', async () => {
    const res = await request(app).get('/api/health')
    expect(res.status).toBe(200)
    expect(res.body.status).toBe('ok')
  })

  it('registers, logs in, creates and reads a goal', async () => {
    const user = await registerAndLogin('smoke')
    expect(user.token).toBeTruthy()

    const goal = await createGoal(user.token, { title: 'Viaje', totalAmount: 1000 })
    expect(goal.id).toBeTruthy()

    const list = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${user.token}`)
    expect(list.status).toBe(200)
    expect(list.body).toHaveLength(1)
    expect(list.body[0].id).toBe(goal.id)
  })

  it('rejects a mismatched password confirmation', async () => {
    const res = await request(app)
      .post('/api/users')
      .send({
        email: uniqueEmail('mismatch'),
        password: PASSWORD,
        passwordConfirmation: 'Otra-Cosa-123',
      })
    expect(res.status).toBe(422)
  })
})
