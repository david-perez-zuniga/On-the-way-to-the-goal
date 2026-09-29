import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The suite drives the real Express app through supertest and talks to a real Postgres,
    // so files must not run concurrently: they share one database and would truncate each
    // other's fixtures. Isolation comes from sequential execution plus a truncate in
    // beforeEach, not from a mock.
    fileParallelism: false,
    sequence: { concurrent: false },
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    // A hung request must fail the run instead of stalling CI.
    testTimeout: 20_000,
    hookTimeout: 30_000,
    setupFiles: ['tests/setup.ts'],
  },
})
