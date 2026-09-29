import { describe, it, expect, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app, registerAndLogin, createGoal, resetState, closeDatabase, PASSWORD, type RegisteredUser } from './helpers'
import { uniqueEmail } from './helpers'

/**
 * Input validation at the transport boundary.
 *
 * The 2025 defect was structural: unvalidated bodies reached Prisma, where a Decimal
 * overflow, a division by zero or a null column produced an unmapped fault that the error
 * handler had to report as a 500. Every case below must be a 4XX with a structured body.
 */
describe('input validation', () => {
  let user: RegisteredUser
  let goalId: string

  beforeEach(async () => {
    await resetState()
    user = await registerAndLogin('validation')
    const goal = await createGoal(user.token)
    goalId = goal.id
  })

  afterAll(closeDatabase)

  const postGoal = (body: unknown) =>
    request(app).post('/api/goals').set('Authorization', `Bearer ${user.token}`).send(body as object)

  describe('goal body shape', () => {
    /** Sends a raw payload so primitive top-level JSON can be tested; supertest's `.send()`
     *  refuses a bare number or string. */
    const postRawGoal = (raw: string | undefined) => {
      const call = request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${user.token}`)
        .set('Content-Type', 'application/json')
      return raw === undefined ? call.send() : call.send(raw)
    }

    it.each([
      ['null body', null],
      ['array body', []],
      ['object body', { title: 'Meta' }],
    ])('%s is rejected with a 4XX and a structured error', async (_name, body) => {
      const res = await postGoal(body)
      expect(res.status).toBeGreaterThanOrEqual(400)
      expect(res.status).toBeLessThan(500)
      expect(res.body).toHaveProperty('code')
    })

    it('rejects a request with no body at all', async () => {
      const res = await postRawGoal(undefined)
      expect(res.status).toBeGreaterThanOrEqual(400)
      expect(res.status).toBeLessThan(500)
    })

    it('rejects a scalar JSON body sent raw', async () => {
      // `null`, `42` and `"texto"` parse successfully, so they are the interesting cases:
      // a parser that stops at "is it valid JSON" would let them through.
      for (const raw of ['null', '42', '"texto"', 'true']) {
        const res = await postRawGoal(raw)
        expect(res.status, `payload ${raw}`).toBeGreaterThanOrEqual(400)
        expect(res.status, `payload ${raw}`).toBeLessThan(500)
        expect(res.body, `payload ${raw}`).toHaveProperty('code')
      }
    })
  })

  describe('title', () => {
    it.each([
      ['null', null],
      ['number', 123],
      ['object', { a: 1 }],
      ['array', ['a']],
      ['boolean', true],
      ['empty string', ''],
      ['only whitespace', '   '],
    ])('%s is rejected', async (_name, title) => {
      const res = await postGoal({ title, totalAmount: 100, currency: 'USD' })
      expect(res.status).toBe(422)
    })

    it('rejects a title beyond the maximum length', async () => {
      const res = await postGoal({ title: 'A'.repeat(500), totalAmount: 100, currency: 'USD' })
      expect(res.status).toBe(422)
    })

    it('accepts a title at the maximum length', async () => {
      const res = await postGoal({ title: 'A'.repeat(120), totalAmount: 100, currency: 'USD' })
      expect(res.status).toBe(201)
    })
  })

  describe('totalAmount', () => {
    it.each([
      ['null', null],
      ['string', '500'],
      ['zero', 0],
      ['negative', -50],
      ['1e-320 underflows the column', 1e-320],
      ['beyond Decimal precision', 1e30],
      ['array', [1]],
      ['boolean', true],
    ])('%s is rejected', async (_name, totalAmount) => {
      const res = await postGoal({ title: 'Meta', totalAmount, currency: 'USD' })
      expect(res.status).toBe(422)
    })

    it('rejects a non-finite amount', async () => {
      // Serialized as JSON these become null, so the check has to happen after parsing.
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${user.token}`)
        .set('Content-Type', 'application/json')
        .send('{"title":"Meta","totalAmount":1e999,"currency":"USD"}')
      expect(res.status).toBe(422)
    })
  })

  describe('currency', () => {
    it.each([
      ['null', null],
      ['empty', ''],
      ['number', 5],
      ['injection attempt', "USD'; DROP TABLE x;--"],
      ['excessively long', 'U'.repeat(50)],
    ])('%s is rejected', async (_name, currency) => {
      const res = await postGoal({ title: 'Meta', totalAmount: 100, currency })
      expect(res.status).toBe(422)
    })
  })

  describe('deposits', () => {
    const deposit = (body: unknown) =>
      request(app)
        .post('/api/payment')
        .set('Authorization', `Bearer ${user.token}`)
        .send(body as object)

    it.each([
      ['null deposit', { deposit: null, currency: 'USD' }],
      ['zero', { deposit: 0, currency: 'USD' }],
      ['negative', { deposit: -5, currency: 'USD' }],
      ['string', { deposit: '50', currency: 'USD' }],
      ['array', { deposit: [1], currency: 'USD' }],
      ['underflowing', { deposit: 1e-320, currency: 'USD' }],
      ['overflowing', { deposit: 1e30, currency: 'USD' }],
    ])('%s is rejected', async (_name, body) => {
      const res = await deposit({ ...(body as object), goalId })
      expect(res.status).toBe(422)
    })

    it('requires a goalId', async () => {
      const res = await deposit({ deposit: 10, currency: 'USD' })
      expect(res.status).toBe(422)
    })

    it('accepts a valid deposit', async () => {
      const res = await deposit({ deposit: 10, currency: 'USD', goalId })
      expect(res.status).toBe(201)
    })
  })

  describe('registration', () => {
    it.each([
      ['invalid email', 'not-an-email'],
      ['email with injection', "a'--@b.com "],
      ['null email', null],
      ['array email', ['a@b.com']],
    ])('%s is rejected', async (_name, email) => {
      const res = await request(app)
        .post('/api/users')
        .send({ email, password: PASSWORD, passwordConfirmation: PASSWORD })
      expect(res.status).toBe(422)
    })

    it('requires a confirmation that matches', async () => {
      const mismatch = await request(app)
        .post('/api/users')
        .send({
          email: uniqueEmail('mismatch'),
          password: PASSWORD,
          passwordConfirmation: 'Completamente-otra-1',
        })
      expect(mismatch.status).toBe(422)

      const missing = await request(app)
        .post('/api/users')
        .send({ email: uniqueEmail('missing'), password: PASSWORD })
      expect(missing.status).toBe(422)
    })

    it('rejects a short password', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: uniqueEmail('short'), password: 'corta', passwordConfirmation: 'corta' })
      expect(res.status).toBe(422)
    })

    it('rejects a duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: user.email, password: PASSWORD, passwordConfirmation: PASSWORD })
      expect(res.status).toBe(409)
    })
  })
})
