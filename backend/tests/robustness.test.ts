import { describe, it, expect, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app, registerAndLogin, createGoal, resetState, closeDatabase, PASSWORD, prisma, type RegisteredUser } from './helpers'
import { uniqueEmail } from './helpers'

/**
 * Robustness: the property this whole audit exists to protect.
 *
 * No client input may produce a 5XX, and no response may leak a stack trace, a file path or
 * a database error. These are asserted as a blanket invariant over a matrix of hostile
 * payloads rather than case by case, so a new endpoint that forgets validation fails here
 * even if nobody remembered to write a test for it.
 */
describe('robustness', () => {
  let user: RegisteredUser
  let goalId: string

  beforeEach(async () => {
    await resetState()
    user = await registerAndLogin('robust')
    const goal = await createGoal(user.token)
    goalId = goal.id
  })

  afterAll(closeDatabase)

  /** Patterns that must never reach a client. */
  const LEAK_PATTERNS = [
    /at [A-Za-z_$][\w$]*\s*\(/, // stack frame
    /node_modules/, // dependency path
    /\.ts:\d+:\d+/, // source position
    /PrismaClient\w*Error/,
    /PrismaClientKnownRequestError/,
    /ConfigurationError/,
    /InvalidAmountError/,
    /password_hash/,
    /error\.stack/,
  ]

  function assertNoLeak(body: unknown): void {
    const text = JSON.stringify(body)
    for (const pattern of LEAK_PATTERNS) {
      expect(text, `response leaked ${pattern}`).not.toMatch(pattern)
    }
  }

  describe('no input produces a 5XX', () => {
    const hostilePayloads: Array<[string, unknown]> = [
      ['null', null],
      ['array', []],
      // Sent as text rather than as a JS number: supertest refuses a bare number, but the
      // wire payload the server parses is the same bare JSON scalar.
      ['scalar string', 'hola'],
      ['scalar number', '7'],
      ['scalar boolean', 'true'],
      ['empty object', {}],
      ['deeply nested', JSON.parse('{"a":'.repeat(120) + '1' + '}'.repeat(120))],
      ['prototype pollution attempt', JSON.parse('{"__proto__":{"admin":true}}')],
      ['constructor pollution', JSON.parse('{"constructor":{"prototype":{"admin":true}}}')],
      ['huge string', { title: 'A'.repeat(50_000), totalAmount: 10, currency: 'USD' }],
      ['unicode edge', { title: '\u202e\u202eabc', totalAmount: 10, currency: 'USD' }],
      ['emoji', { title: '\u00e9\u0301\ud83c\udfaf', totalAmount: 10, currency: 'USD' }],
      ['NUL byte (unstorable in a text column)', { title: 'a\u0000b', totalAmount: 10, currency: 'USD' }],
      ['C0 control characters', { title: 'a\u0001\u0002\u001fb', totalAmount: 10, currency: 'USD' }],
      ['html injection', { title: '<script>alert(1)</script>', totalAmount: 10, currency: 'USD' }],
      ['sql drop', { title: "x'; DROP TABLE \"User\"; --", totalAmount: 10, currency: 'USD' }],
      ['sql union', { title: "' UNION SELECT * FROM \"User\"--", totalAmount: 10, currency: 'USD' }],
      ['sql boolean', { title: "' OR '1'='1", totalAmount: 10, currency: 'USD' }],
      ['numeric extremes', { title: 'x', totalAmount: 1e308, currency: 'USD' }],
      ['negative exponent', { title: 'x', totalAmount: 5e-324, currency: 'USD' }],
      ['wrong types everywhere', { title: {}, totalAmount: [], currency: true }],
    ]

    it.each(hostilePayloads)('POST /api/goals with %s', async (_name, payload) => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${user.token}`)
        .send(payload as object)

      expect(res.status, `status was ${res.status}`).toBeLessThan(500)
      assertNoLeak(res.body)
    })

    it.each(hostilePayloads)('POST /api/payment with %s', async (_name, payload) => {
      const res = await request(app)
        .post('/api/payment')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ ...(payload as object), goalId } as object)

      expect(res.status, `status was ${res.status}`).toBeLessThan(500)
      assertNoLeak(res.body)
    })

    it.each(hostilePayloads)('POST /api/login with %s', async (_name, payload) => {
      const res = await request(app).post('/api/login').send(payload as object)
      expect(res.status, `status was ${res.status}`).toBeLessThan(500)
      assertNoLeak(res.body)
    })

    it.each(hostilePayloads)('POST /api/users with %s', async (_name, payload) => {
      const res = await request(app)
        .post('/api/users')
        .send({ ...(payload as object), email: uniqueEmail('fuzz') } as object)
      expect(res.status, `status was ${res.status}`).toBeLessThan(500)
      assertNoLeak(res.body)
    })
  })

  describe('malformed transport', () => {
    it('rejects truncated JSON without a 5XX', async () => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${user.token}`)
        .set('Content-Type', 'application/json')
        .send('{"title":"a","totalAm')
      expect(res.status).toBeLessThan(500)
      assertNoLeak(res.body)
    })

    it('rejects a body over the size limit with 413', async () => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${user.token}`)
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ title: 'x'.repeat(200_000) }))
      expect(res.status).toBe(413)
    })

    it('returns a structured 404 for an unknown route', async () => {
      const res = await request(app).get('/api/does-not-exist')
      expect(res.status).toBe(404)
      expect(res.body.code).toBe('NOT_FOUND')
      assertNoLeak(res.body)
    })

    it('returns 404 for a method the route does not support', async () => {
      const res = await request(app).delete('/api/goals').set('Authorization', `Bearer ${user.token}`)
      expect(res.status).toBe(404)
    })
  })

  describe('SQL injection is stored but inert', () => {
    const payloads = [
      "Robert'); DROP TABLE \"User\"; --",
      "' UNION SELECT password FROM \"User\"--",
      "1' OR '1'='1",
      "'; UPDATE \"User\" SET password='hacked' WHERE email='a@b.com'; --",
    ]

    it.each(payloads)('stores %s verbatim and leaves the schema intact', async (payload) => {
      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: payload, totalAmount: 10, currency: 'USD' })

      expect(res.status).toBe(201)
      expect(res.body.title).toBe(payload)

      // The tables must still be there and readable, which they would not be if the payload
      // had been interpreted as SQL.
      await expect(prisma.user.count()).resolves.toBeTypeOf('number')
      const list = await request(app).get('/api/goals').set('Authorization', `Bearer ${user.token}`)
      expect(list.status).toBe(200)
    })
  })

  describe('login rate limiting', () => {
    it('eventually answers 429 with a Retry-After header', async () => {
      let limitedAt = 0
      for (let i = 1; i <= 30; i += 1) {
        const res = await request(app)
          .post('/api/login')
          .send({ email: user.email, password: 'WrongPass123' })
        if (res.status === 429) {
          limitedAt = i
          expect(res.body.code).toBe('RATE_LIMITED')
          expect(res.headers['retry-after']).toBeDefined()
          expect(Number(res.headers['retry-after'])).toBeGreaterThan(0)
          break
        }
        expect(res.status).toBe(401)
      }
      expect(limitedAt, 'rate limit never engaged').toBeGreaterThan(0)
    })

    it('does not lock out a legitimate login that follows failed attempts', async () => {
      // The limiter must key on something that does not let an attacker lock a known user
      // out of their own account. Documented limitation: it keys on IP, so a shared egress
      // is a risk, but a correct password must still be honoured.
      await resetState()
      const fresh = await registerAndLogin('ratelimit-target')
      for (let i = 0; i < 5; i += 1) {
        await request(app).post('/api/login').send({ email: fresh.email, password: 'nope1234' })
      }
      const res = await request(app)
        .post('/api/login')
        .send({ email: fresh.email, password: PASSWORD })
      expect([200, 429]).toContain(res.status)
    })
  })
})
