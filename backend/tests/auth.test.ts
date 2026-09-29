import { describe, it, expect, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app, registerAndLogin, resetState, closeDatabase, PASSWORD } from './helpers'
import { uniqueEmail, type RegisteredUser } from './helpers'

/**
 * Authorization boundaries.
 *
 * The bypass this suite guards against was a single weak default signing key that let
 * anyone mint a token for any user. These tests assert the property rather than the
 * implementation: a token this server did not issue cannot read or mutate anything.
 */
describe('authentication and authorization', () => {
  // Users are created per test, not once in beforeAll: resetState truncates the tables, so a
  // user created in beforeAll would no longer exist by the time the second test logged in.
  // That failure mode is a test bug that looks exactly like an auth bug.
  let userA: RegisteredUser
  beforeEach(async () => {
    await resetState()
    userA = await registerAndLogin('auth')
  })
  afterAll(closeDatabase)

  describe('rejects unauthenticated access', () => {
    const protectedRoutes: Array<[string, string]> = [
      ['get', '/api/goals'],
      ['post', '/api/goals'],
      ['post', '/api/payment'],
      ['get', '/api/payment/goal/00000000-0000-4000-8000-000000000000'],
    ]

    it.each(protectedRoutes)('%s %s without a token is 401', async (method, path) => {
      const agent = request(app) as unknown as Record<string, (p: string) => request.Test>
      const res = await agent[method]!(path)
      expect(res.status).toBe(401)
    })
  })

  describe('rejects malformed credentials', () => {
    it('raw token with no scheme is 401', async () => {
      const res = await request(app).get('/api/goals').set('Authorization', userA.token)
      expect(res.status).toBe(401)
    })

    it('wrong scheme is 401', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Basic ${userA.token}`)
      expect(res.status).toBe(401)
    })

    it('structurally invalid token is 401', async () => {
      const res = await request(app).get('/api/goals').set('Authorization', 'Bearer not-a-jwt')
      expect(res.status).toBe(401)
    })

    it('empty bearer value is 401', async () => {
      const res = await request(app).get('/api/goals').set('Authorization', 'Bearer ')
      expect(res.status).toBe(401)
    })

    it('scheme with no token is 401', async () => {
      const res = await request(app).get('/api/goals').set('Authorization', 'Bearer')
      expect(res.status).toBe(401)
    })

    it('rejects a token signed with a different key', async () => {
      // Well-formed header and payload, wrong signature. This is the shape of the original
      // bypass: with no signature check the payload alone was enough.
      const forged =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
        Buffer.from(JSON.stringify({ userId: userA.id })).toString('base64url') +
        '.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'
      const res = await request(app).get('/api/goals').set('Authorization', `Bearer ${forged}`)
      expect(res.status).toBe(401)
    })

    it('rejects an absurdly long token without producing a 5XX', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${'a'.repeat(20_000)}`)
      // Node's HTTP layer refuses the oversized header before Express is reached, so 431 is
      // the expected answer; 401 is accepted in case that changes. The invariant under test
      // is "always a 4XX, never a crash".
      expect([401, 431]).toContain(res.status)
      expect(res.status).toBeLessThan(500)
    })
  })

  describe('accepts a legitimately issued token', () => {
    it('is case-insensitive on the scheme per RFC 7235', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `bearer ${userA.token}`)
      expect(res.status).toBe(200)
    })

    it('tolerates extra whitespace after the scheme', async () => {
      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer    ${userA.token}`)
      expect(res.status).toBe(200)
    })
  })

  describe('login', () => {
    it('rejects a wrong password without revealing whether the user exists', async () => {
      const known = await request(app)
        .post('/api/login')
        .send({ email: userA.email, password: 'WrongPass123' })
      const unknown = await request(app)
        .post('/api/login')
        .send({ email: uniqueEmail('ghost'), password: 'WrongPass123' })

      expect(known.status).toBe(401)
      expect(unknown.status).toBe(401)
      // Identical bodies: a different message or status would enumerate valid accounts.
      expect(known.body).toEqual(unknown.body)
    })

    it('issues a token that carries an expiry', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ email: userA.email, password: PASSWORD })
      expect(res.status).toBe(200)

      const claims = JSON.parse(
        Buffer.from(res.body.token.split('.')[1] as string, 'base64url').toString('utf8'),
      ) as { exp?: number; iat?: number }
      expect(claims.iat).toBeTypeOf('number')
      expect(claims.exp).toBeTypeOf('number')
      expect(claims.exp as number).toBeGreaterThan(claims.iat as number)
    })
  })
})
