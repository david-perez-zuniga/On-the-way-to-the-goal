import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))

/**
 * Point the process at the test database and the throwaway signing key BEFORE any module
 * that reads them is imported.
 *
 * The Prisma pool captures `process.env.DATABASE_URL` when `infrastructure/db/prisma.ts` is
 * first evaluated, so this has to happen in a setup file rather than inside a test body.
 * `dotenv` does not overwrite variables that are already set, so loading `.env.test` here
 * also shields the suite from the developer's real `.env` being picked up later by the
 * `dotenv/config` import inside `app.ts`.
 */
config({ path: resolve(here, '../.env.test'), override: true })

if (!process.env.DATABASE_URL?.includes('db-WayToTheGoal_test')) {
  throw new Error(
    `Refusing to run: DATABASE_URL must point at db-WayToTheGoal_test, got ${
      process.env.DATABASE_URL ? 'a different database' : 'nothing'
    }. Run the suite with \`pnpm test\` so the env is loaded.`,
  )
}
