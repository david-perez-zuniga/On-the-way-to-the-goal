import { describe, it, expect, afterAll, beforeEach } from 'vitest'
import request from 'supertest'
import { app, registerAndLogin, createGoal, resetState, closeDatabase, type RegisteredUser } from './helpers'

/**
 * Cross-user authorization (IDOR).
 *
 * Every endpoint that touches a goal must be scoped by owner. The original defect was that
 * lookups were performed by id alone, so any authenticated user could read, edit, delete or
 * fund someone else's goal simply by supplying its id.
 *
 * The non-owner must receive 404 rather than 403: a 403 would confirm the resource exists,
 * which is itself a leak of the identifier space.
 */
describe('cross-user access control', () => {
  let alice: RegisteredUser
  let bob: RegisteredUser
  let aliceGoalId: string

  beforeEach(async () => {
    await resetState()
    alice = await registerAndLogin('alice')
    bob = await registerAndLogin('bob')
    const goal = await createGoal(alice.token, { title: 'Meta de Alice', totalAmount: 500 })
    aliceGoalId = goal.id
  })

  afterAll(closeDatabase)

  const asBob = <T extends request.Test>(t: T): T =>
    t.set('Authorization', `Bearer ${bob.token}`) as T

  it("bob cannot read alice's goal progress", async () => {
    const res = await asBob(request(app).get(`/api/goals/${aliceGoalId}`))
    expect(res.status).toBe(404)
  })

  it("bob cannot update alice's goal", async () => {
    const res = await asBob(
      request(app)
        .put(`/api/goals/${aliceGoalId}`)
        .send({ title: 'Secuestrada', totalAmount: 999, currency: 'USD' }),
    )
    expect(res.status).toBe(404)

    // The attempt must leave the row untouched, not merely report failure.
    const after = await request(app)
      .get(`/api/goals/${aliceGoalId}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(after.status).toBe(200)
    expect(after.body.goal.title).toBe('Meta de Alice')
    expect(Number(after.body.goal.totalAmount)).toBe(500)
  })

  it("bob cannot delete alice's goal", async () => {
    const res = await asBob(request(app).delete(`/api/goals/${aliceGoalId}`))
    expect(res.status).toBe(404)

    const after = await request(app)
      .get(`/api/goals/${aliceGoalId}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(after.status).toBe(200)
  })

  it("bob cannot deposit into alice's goal", async () => {
    const res = await asBob(
      request(app)
        .post('/api/payment')
        .send({ goalId: aliceGoalId, deposit: 50, currency: 'USD' }),
    )
    expect(res.status).toBe(404)

    const history = await request(app)
      .get(`/api/payment/goal/${aliceGoalId}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(history.status).toBe(200)
    expect(history.body).toHaveLength(0)
  })

  it("bob cannot read alice's payment history", async () => {
    const res = await asBob(request(app).get(`/api/payment/goal/${aliceGoalId}`))
    expect(res.status).toBe(404)
  })

  it('goal listings are scoped to the caller', async () => {
    await createGoal(bob.token, { title: 'Meta de Bob' })

    const aliceList = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${alice.token}`)
    const bobList = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${bob.token}`)

    expect(aliceList.body.map((g: { id: string }) => g.id)).toEqual([aliceGoalId])
    expect(bobList.body.map((g: { id: string }) => g.id)).not.toContain(aliceGoalId)
  })

  it('the owner keeps full access to their own goal', async () => {
    const read = await request(app)
      .get(`/api/goals/${aliceGoalId}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(read.status).toBe(200)

    const deposit = await request(app)
      .post('/api/payment')
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ goalId: aliceGoalId, deposit: 25, currency: 'USD' })
    expect(deposit.status).toBe(201)

    const update = await request(app)
      .put(`/api/goals/${aliceGoalId}`)
      .set('Authorization', `Bearer ${alice.token}`)
      .send({ title: 'Mi meta', totalAmount: 800, currency: 'USD' })
    expect(update.status).toBe(200)

    const remove = await request(app)
      .delete(`/api/goals/${aliceGoalId}`)
      .set('Authorization', `Bearer ${alice.token}`)
    expect(remove.status).toBe(204)
  })

  describe('mass assignment', () => {
    it('ignores id, userId and createdAt injected into the update body', async () => {
      const res = await request(app)
        .put(`/api/goals/${aliceGoalId}`)
        .set('Authorization', `Bearer ${alice.token}`)
        .send({
          id: bob.id,
          userId: bob.id,
          createdAt: '2020-01-01T00:00:00.000Z',
          title: 'Titulo legitimo',
          totalAmount: 600,
          currency: 'USD',
        })

      expect(res.status).toBe(200)
      expect(res.body.id).toBe(aliceGoalId)
      expect(res.body.userId).toBe(alice.id)
      // An ownership transfer through the body would be a full account takeover primitive.
      expect(res.body.userId).not.toBe(bob.id)

      const after = await request(app)
        .get(`/api/goals/${aliceGoalId}`)
        .set('Authorization', `Bearer ${alice.token}`)
      expect(new Date(after.body.goal.createdAt).getFullYear()).toBeGreaterThan(2000)
    })

    it('cannot redirect a payment to another user goal via the body', async () => {
      const bobGoal = await createGoal(bob.token, { title: 'Meta de Bob' })
      const res = await request(app)
        .post('/api/payment')
        .set('Authorization', `Bearer ${alice.token}`)
        .send({ goalId: bobGoal.id, deposit: 10, currency: 'USD' })
      expect(res.status).toBe(404)
    })
  })
})
