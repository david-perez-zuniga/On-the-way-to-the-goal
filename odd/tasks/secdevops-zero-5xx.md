# SecDevOps: Zero 5XX / Zero Trust Audit

## Objective
Drive the local backend to a state where no malformed, hostile, or absurd client input
produces an unhandled HTTP 5XX, a process crash, or a cross-user data leak.

## Problem
Reconnaissance (read-only) on 2026-09-28 found the API has **zero input validation** and
**a catch-all `500` in every controller**. Every unhandled error type — a TypeError, a
Prisma constraint violation, a Decimal error — is reported to the client as `500 Internal
Server Error`, which is both a correctness bug and a blind 5XX for clients.

Separately, 5 of the 10 routes are missing ownership scoping at the repository query level,
which is a confirmed **IDOR (Broken Object Level Authorization)**.

## Scope
In scope: `backend/src/**` (Express transport, controllers, use-cases, repositories), and
`backend/prisma/schema.prisma` field types as they constrain valid input.

Out of scope: `frontend/**`, deployment config, real infrastructure, network exposure.
No raw SQL exists in the codebase, so there is no SQL-injection surface to fix.

## Environment constraints
- Postgres `localhost:5432/db-WayToTheGoal` is **empty** (0 users, 0 goals, 0 payments).
  Fuzzing writes are disposable, but the DB is a real dev instance, not a container.
- `pnpm test` is a stub (`Error: no test specified`) — **there is no automated regression net**.
- Boot command: `backend/node_modules/.bin/tsx src/index.ts` (`npx` fails on `devEngines.type`).
- Health probe: `GET /api/health`.

## Route inventory
| Method | Path | Auth | Input | Use case |
|---|---|---|---|---|
| GET | /api/health | no | — | inline |
| POST | /api/users | no | email, password | CreateUserCase |
| POST | /api/login | no | email, password | LoginUseCase |
| GET | /api/goals | yes | JWT userId | GetUserGoalsUseCase |
| GET | /api/goals/:goalId | yes | goalId | GetGoalProgressUseCase |
| POST | /api/goals | yes | title, totalAmount, currency | CreateGoalUseCase |
| PUT | /api/goals/:id | yes | id + full body | UpdateGoalUseCase |
| DELETE | /api/goals/:id | yes | id | DeleteGoalUseCase |
| GET | /api/payment/goal/:goalId | yes | goalId | GetPaymentHistoryUseCase |
| POST | /api/payment | yes | deposit, currency, goalId | CreatePaymentUseCase |

## Prior audit already on record
Memory `audit/api-robustness-2026-09` (session `ses_f15489998ffedPsYON8kofWEaK`, 2026-09-28
19:19) ran **152 destructive cases; 58 returned 5XX**. That work DETECTED only — no repair
was committed. The exploit phase is already evidenced and does not need re-running. The
gap is the fix phase, which is what this document tracks.

Findings from that audit that static reading cannot reproduce, carried forward as verified:
- `totalAmount`/`deposit` are `numeric(65,30)`. `1e308` overflows (Prisma P2020) -> 500.
  `1e-320` UNDERFLOWS to exactly 0 and is accepted on write.
- **Persistent stored-data DoS**: `POST /api/payment` with `deposit: 1e-320` returns 201, but
  `Payment.ts:13` `if (deposit.lte(0)) throw` fires on re-read, so `GET /api/goals` then 500s
  for that user indefinitely. Write path accepts what the read path cannot handle.
- `authMiddleware.ts:26` `header.replace('Bearer ','')` ignores the scheme and never validates
  the prefix. Not an auth bypass, but the parsing is wrong.
- CORS is safe: `origin` is static, never reflected. A 500 observed on the CORS probe was a
  false positive caused by the poisoned-payment rows.
- SQLi is not exploitable (Prisma parameterizes), but no output encoding exists, so stored
  XSS payloads persist raw in `Goal.title`.
- No length limits: a 50,000-char email was persisted. Only `express.json()`'s 100kb default
  backstops it (200k body -> 413).
- Operational: `npm` fails on this `package.json`; use `pnpm`. Plain `nohup ... &` dies with
  the parent shell — use `setsid nohup ... < /dev/null &` and resolve the real PID with
  `lsof -t -i:3000 -sTCP:LISTEN`. Log isolation: watermark the log by byte offset per case,
  then slice the new bytes for the exact stack trace.

## Confirmed defects (recon, pre-exploitation)

### IDOR — ownership not enforced at the query
- `PrismaGoalRepository.delete` — `goal.delete({where:{id}})`, no `userId` (`PrismaGoalRepository.ts:90`)
- `PrismaGoalRepository.findById` — `goal.findUnique({where:{id}})`, no `userId` (`PrismaGoalRepository.ts:25`)
- `PrismaPaymentRepository.findByGoalId` — `payment.findMany({where:{goalId}})`, no `userId` (`PrismaPaymentRepository.ts:20`)
- `CreatePaymentUseCase` DTO has no `userId` field at all (`CreatePaymentUseCase.ts:6`)
- `PrismaGoalRepository.update` — `where:{id}` only, and writes `userId` into `data`, so a goal
  can be reassigned to a different owner (`PrismaGoalRepository.ts:71-84`)

### Crash paths → 500
- `GetGoalProgressUseCase.ts:34` — `currentAmount.div(totalAmount)` with no zero guard.
  `GetUserGoalsUseCase.ts:32` guards the same division; this one does not. `totalAmount: 0` → 500.
- `new Prisma.Decimal(undefined | null | {} | "abc")` in create/update/payment → 500 instead of 400
- `bcrypt.hash(undefined)` on `POST /api/users` → 500
- `PUT /api/goals/:id` on an unknown id → Prisma P2025 → 500 instead of 404
- `PUT` with `createdAt: "not-a-date"` → Prisma DateTime parse error → 500
- No global Express error handler in `index.ts`; `express.json()` has no explicit limit

### Absent controls
- No rate limiting on `POST /api/login` (credential brute force)
- `JWT_SECRET` falls back to the literal `'SECRETO'` if unset (`authMiddleware.ts:4`, `LoginUseCase.ts:25`)

## Verification strategy (decided)
HTTP probes only — no test suite added. Each fix is verified by re-running that endpoint's
abuse matrix plus a happy-path check on every route, to prove normal behavior still works.
Known accepted risk: no persistent regression net exists for future changes.

## Tasks
- [ ] T1 `POST /api/users` — validate email/password, kill bcrypt crash
- [ ] T2 `POST /api/login` — stop 401-masking of real 500s, add rate limit
- [ ] T3 `POST /api/goals` — validate title/totalAmount/currency
- [ ] T4 `GET /api/goals/:goalId` — IDOR + unguarded division by zero
- [ ] T5 `GET /api/payment/goal/:goalId` — IDOR payment-history leak
- [ ] T6 `POST /api/payment` — IDOR deposit + `1e-320` underflow poison
- [ ] T7 `PUT /api/goals/:id` — IDOR + ownership transfer via `userId` in data
- [ ] T8 `DELETE /api/goals/:id` — IDOR
- [ ] T9 `GET /api/goals` — poison read path
- [ ] T10 Global error handler, `express.json` limit, fail-closed `JWT_SECRET`

## Route declaration
Recon and this plan: inline (bounded reads, decisions only).
T1-T4: delegated writer (each touches 2+ non-trivial files).
Verification: delegated per-action worker.

## Acceptance criteria
- No route returns 5XX for any input in the abuse matrix.
- Malformed input returns 400/404/409/422 with a message, never a stack trace.
- A user cannot read, mutate, or delete another user's goal or payment.
- `console.error` noise from client-caused errors is eliminated.
