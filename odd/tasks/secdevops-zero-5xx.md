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
- [x] T1 `POST /api/users` — validated. 19/19 cases 2XX/4XX. Found and fixed a credential
      leak: the registration response returned the bcrypt hash.
- [x] T2 `POST /api/login` — validated, rate-limited, log noise removed. **Found a total
      authentication bypass**: `JWT_SECRET` was the literal `"SECRETO"` in `.env` and was also
      the hardcoded fallback in two source files, so any repository reader could forge a
      token for any userId. Rotated to a 64-char random secret and made the config fail closed.
      Also fixed `authMiddleware` accepting a raw token with no `Bearer` scheme.
- [x] T3 `POST /api/goals` — validated. 13/13 abusive cases now 422; previously 6 were 500.
      `totalAmount: 0` and negatives were being accepted, which armed the division by zero.
- [x] T4 `GET /api/goals/:goalId` — IDOR closed (404), division by zero guarded on both the
      write and the read side.
- [x] T5 `GET /api/payment/goal/:goalId` — IDOR closed. Added an explicit ownership check so
      "foreign goal" and "empty history" are no longer indistinguishable.
- [x] T6 `POST /api/payment` — IDOR closed, and the `1e-320` underflow poison is rejected at
      the boundary and again after currency conversion.
- [x] T7 `PUT /api/goals/:id` — IDOR and ownership transfer closed. `userId` is no longer
      writable and `createdAt` is read from the stored record instead of the request body.
- [x] T8 `DELETE /api/goals/:id` — IDOR closed. First fix returned a lying 204 because
      `await ....catch(next)` swallowed the rejection and then sent 204 unconditionally;
      rewritten with try/catch so the 204 is tied to a real delete.
- [x] T9 `GET /api/goals` — legacy rows that violate an invariant are skipped with a
      data-integrity warning instead of faulting the whole collection.

## Verification summary
- Full-surface hostile sweep: **91 requests, 0 responses in the 5XX range.**
- Server log after the sweep: **0 stack-trace lines.**
- Cross-user matrix: all 5 IDOR routes answer 404 to a foreign token, while the owner keeps
  full 200/201/204 function.
- SQL injection stored verbatim and inert; all 4 tables survive.
- `tsc --noEmit` reports 0 errors in `src/`. The 4 `TS6059` errors about the generated Prisma
  client and `prisma.config.ts` sit outside `rootDir` and pre-exist on the original code.

## Commits
- `7a0440d` — T1 user registration validation, typed domain errors, global error handler
- `f7c77e0` — T2 JWT forgery bypass closed, Bearer scheme, login rate limit
- T3–T9 — ownership enforcement, money/title/currency validation, poison prevention

## Route declaration
Recon and this plan: inline (bounded reads, decisions only).
T1-T4: delegated writer (each touches 2+ non-trivial files).
Verification: delegated per-action worker.

## Acceptance criteria
- No route returns 5XX for any input in the abuse matrix.
- Malformed input returns 400/404/409/422 with a message, never a stack trace.
- A user cannot read, mutate, or delete another user's goal or payment.
- `console.error` noise from client-caused errors is eliminated.

---

## Phase 2 — loose ends closed and regression re-verified

TDD: not applicable, no test runner exists in this repo (see "Testing" below). Verification was
behavioural: a black-box HTTP matrix plus `tsc --noEmit`.

### What changed

- `tsconfig.json`: dropped `rootDir`/`outDir` (the generated Prisma client and `prisma.config.ts`
  legitimately live outside `src`), scoped `include` to `src`, enabled `noUnusedLocals` and
  `noUnusedParameters`. The 4 pre-existing `TS6059` errors are gone; the project now typechecks
  clean end to end.
- `package.json`: added `"typecheck": "tsc --noEmit"`. The check existed but was never runnable.
- `authMiddleware`: a `ConfigurationError` from `getJwtSecret()` is now forwarded to the error
  handler instead of being flattened into 401. It was re-introducing the exact outage-masking bug
  that `7a0440d` removed on the login path: a broken `JWT_SECRET` would have answered every
  authenticated request with 401 and looked like a fleet of invalid credentials.
- `env.ts` + `index.ts`: `assertCriticalConfiguration()` runs at boot, so a missing or weak
  signing key stops the process with a clear message instead of failing request by request.
- `UserController` + `validators.ts`: **`passwordConfirmation` was never validated.** A typo in
  the confirmation field silently created the account. Found by the phase-2 matrix, which is the
  clearest argument for running one.
- `errorHandler`: a body of literal `null` is valid JSON but not an object, so it no longer
  reports "no es JSON válido" (false). Split into `INVALID_BODY_SHAPE`; the rate limit is 8
  requests per window, and the oversize limit is 100kb.
- `Payment` entity: bare `Error` replaced with `ValidationError`; an out-of-range persisted
  deposit was reported as a 500, blaming the client for a data-integrity condition.
- `PrismaUserRepository.findById/findAll`: unimplemented stubs now say which method is missing
  and report as a genuine server fault, not as an unexplained 500.
- New `domain/valueObjects/amount.ts`: the monetary range rule moved into the domain.
  `CreatePaymentUseCase` was importing the HTTP-boundary validators, which inverted the
  dependency rule (application must not depend on infrastructure). Both layers now share one
  rule and cannot drift.
- Removed dead code I had added: `CLIENT_ATTRIBUTABLE`, the `ValidationError` re-export from
  `rateLimiter`, the `NotFoundError`/`toGoal` re-exports, `GetUserGoalsUseCaseDeps`, and an
  unused `tryGetJwtSecret`.
- `GoalController`: no longer parses or forwards `createdAt`; the field is not part of the
  update contract.

### Corrections to the phase-1 report

- **The stored XSS is not exploitable.** `Goal.title` is rendered as `<h3>{title}</h3>`, a React
  text child, which React escapes. The frontend contains no `dangerouslySetInnerHTML`, no
  `innerHTML`, and no `eval`. The payload is stored unencoded, but nothing executes it. Phase 1
  reported it as live; that was wrong, and the fix was verification, not a code change.
- The email regex contains a nested quantifier, so it was tested for ReDoS rather than assumed
  safe: 4.6ms worst case on a 200KB input, and `requireString` caps it at 254 characters.
  No vulnerability.
- The `Bearer` regex was already case-insensitive. An apparent 401 there was a defect in my own
  probe harness, not in the server.

### A harness bug worth recording

The first phase-2 run reported "IDOR B hijacked A's goal". The probe helper took a literal `auth`
flag and always attached user A's token, so every "cross-user" case was in fact A acting on A.
The regression was green only because the assertions were not being exercised as written. Fixed
by making the helper take a token-variable name plus a `RAW:` escape hatch for malformed-header
cases, and the matrix was re-run from scratch. A green suite means nothing if the suite cannot
fail.

### Regression result (final, with cross-user tokens)

    5XX:               0
    non-5XX:           80
    pass:              80
    fail:              0
    leaks:             0
    rateLimitAt:       8
    owner still A:     OK   (after mass-assignment attempts)

All 5 IDOR vectors return 404 to the non-owner and 200/201 to the owner. Mass-assignment attempts
(`id`, `userId`, `createdAt` in the update body) are ignored and ownership is verified intact
afterwards. `pnpm typecheck` reports 0 errors.

### Testing

`pnpm test` is still the scaffold stub (`Error: no test specified`). The decision not to add a
runner stands, and this is the standing risk: none of the 80 assertions are protected against
regression by CI. A `typecheck` script now exists and is the only automated gate in the repo.

### Fixtures

Local dev database truncated to `0 users / 0 goals / 0 payments`; all 4 tables intact. Server
stopped, port 3000 released, temporary probe artifacts removed.

---

## Phase 3 — automated test suite (vitest)

The audit's own conclusion was that 80 passing HTTP probes were worthless once the script
was deleted. This phase makes them permanent.

### Setup

- `vitest` + `supertest`. Tests drive the real `createApp()` against a real Postgres.
  Nothing is mocked: a mocked authorization check only proves the mock is correct, which is
  precisely the class of bug this suite exists to catch.
- `src/app.ts` extracted from `src/index.ts`. Importing `index.ts` called `listen()` as a
  side effect and occupied a port, so supertest could not mount the app.
- Dedicated database `db-WayToTheGoal_test`, created from the same migrations.
  `tests/setup.ts` refuses to run against any other database, so a mistyped `DATABASE_URL`
  cannot truncate development data.
- `resetRateLimits()` added to the rate limiter so counters do not leak between tests. The
  real limits stay in force, so the rate-limit test still tests the real limit.
- `pnpm test` and `pnpm test:watch`; files run sequentially because they share one database.

### Result

    Test Files  5 passed (5)
    Tests     165 passed (165)

### A new 5XX found by the suite

Fuzzing with control characters produced a real defect the bash matrix had missed:

    postgres 22021: invalid byte sequence for encoding "UTF8": 0x00

A NUL byte inside `Goal.title` cannot be stored in a Postgres `text` column. The write failed,
Prisma surfaced it as an unmapped fault, and the global handler reported 500. Any client could
trigger a server fault with a single character. `requireString` now rejects C0 control
characters (tab, newline and carriage return stay allowed), turning it into a 422.

Worth recording: the error handler behaved correctly throughout. It returned a generic body to
the client and logged the detail server-side, with no stack trace leaked. The gap was purely in
validation, which is an argument for testing the property ("no input produces a 5XX") over
enumerating individual fields.

### The suite was verified to be able to fail

A green suite that cannot fail is worse than no suite, so both invariants were mutated to
confirm detection:

- Removing the owner filter from `PrismaGoalRepository` → 5 IDOR tests fail.
- Removing the C0 guard from `requireString` → the NUL test fails with "status was 500".
- Restoring both → 165/165 green.

### Notes

- Two failures during development were test bugs, not product bugs: users created in
  `beforeAll` were deleted by a `beforeEach` truncate, and a NUL byte in the test source made
  Git treat the file as binary. Both are the kind of defect that reads like a product
  regression, which is why the mutation check above matters.
- Isolation was verified: development database still at 0 rows after a full run.
