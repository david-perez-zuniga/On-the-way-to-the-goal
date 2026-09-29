import { describe, it, expect, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app, registerAndLogin, resetState, closeDatabase, type RegisteredUser } from './helpers'

/**
 * HTML injection in free-text fields.
 *
 * The backend is not a browser and must not attempt to render HTML. The contract is that
 * these fields store plain text only: markup characters are encoded on the way in, so the
 * stored value is inert no matter what the client does with it later.
 *
 * This is defence in depth. React already escapes text children, so `title` is not currently
 * exploitable. Encoding at the boundary means it does not become exploitable the day someone
 * reaches for `dangerouslySetInnerHTML`, or renders the field into an email, a PDF, or a
 * server-side template. The cost is a handful of characters; the cost of being wrong is a
 * stored XSS that survives review because "the frontend escapes it".
 */
describe('HTML injection in free-text fields', () => {
  let user: RegisteredUser
  beforeEach(async () => {
    await resetState()
    user = await registerAndLogin('xss')
  })
  afterAll(closeDatabase)

  const createWithTitle = (title: string) =>
    request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title, totalAmount: 100, currency: 'USD' })

  const createWithEmail = (email: string) =>
    request(app)
      .post('/api/users')
      .send({ email, password: 'Str0ng!Passw0rd', passwordConfirmation: 'Str0ng!Passw0rd' })

  /** Nothing that a browser could parse as a tag or an entity may survive storage. */
  const MARKUP = /<|>/

  const payloads: Array<[string, string]> = [
    ['script tag', '<script>alert(1)</script>'],
    ['img onerror', '<img src=x onerror=alert(1)>'],
    ['svg onload', '<svg/onload=alert(1)>'],
    ['iframe', '<iframe src="javascript:alert(1)"></iframe>'],
    ['anchor with handler', '<a href="#" onclick="steal()">click</a>'],
    ['closing tag injection', '"></script><script>alert(1)</script>'],
    ['html entity', '&lt;script&gt;alert(1)&lt;/script&gt;'],
    ['angle bracket only', '<>'],
    ['nested breakout', '"><img src=x onerror=alert(1)>'],
  ]

  describe('goal title', () => {
    it.each(payloads)('neutralizes %s on create', async (_name, payload) => {
      const res = await createWithTitle(payload)
      expect(res.status).toBe(201)
      expect(res.body.title, 'stored title still contains markup').not.toMatch(MARKUP)
    })

    it.each(payloads)('neutralizes %s on update', async (_name, payload) => {
      const created = await createWithTitle('Titulo inocuo')
      const res = await request(app)
        .put(`/api/goals/${created.body.id}`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: payload, totalAmount: 100, currency: 'USD' })
      expect(res.status).toBe(200)
      expect(res.body.title, 'stored title still contains markup').not.toMatch(MARKUP)
    })

    it('round-trips the value from the database unchanged', async () => {
      const payload = '<script>alert(1)</script>'
      const created = await createWithTitle(payload)

      const read = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${user.token}`)
      expect(read.status).toBe(200)
      // The stored bytes must be inert, and the value must still be recognizable rather
      // than silently dropped, so the owner can tell what their goal is called.
      expect(read.body[0].title).toBe(created.body.title)
      expect(read.body[0].title).not.toMatch(MARKUP)
      expect(read.body[0].title.length).toBeGreaterThan(0)
    })

    it('leaves ordinary text untouched', async () => {
      // Encoding must not mangle the accented characters and punctuation real users type.
      const title = 'Vacaciones en Ñuñoa, año 2026 — 100% 🎉'
      const res = await createWithTitle(title)
      expect(res.status).toBe(201)
      expect(res.body.title).toBe(title)
    })
  })

  describe('email', () => {
    it.each([
      ['script tag', '<script>alert(1)</script>@example.com'],
      ['angle brackets', 'user<@example.com'],
      ['img tag', '<img src=x>@example.com'],
    ])('neutralizes %s', async (_name, email) => {
      const res = await createWithEmail(email)
      // Either the address is refused outright or it is stored encoded; never markup.
      if (res.status === 201) {
        expect(res.body.email).not.toMatch(MARKUP)
      } else {
        expect(res.status).toBeLessThan(500)
        expect(res.status).toBe(422)
      }
    })
  })
})
