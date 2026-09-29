import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { goalRoutes } from './infrastructure/routes/goalRoutes';
import { userRoutes } from './infrastructure/routes/userRoutes';
import { loginRoutes } from './infrastructure/routes/loginRoutes';
import { paymentRoutes } from './infrastructure/routes/paymentRoutes';
import { authenticate } from './infrastructure/middlewares/authMiddleware';
import { errorHandler, notFoundHandler } from './infrastructure/middlewares/errorHandler';
import { assertCriticalConfiguration } from './infrastructure/config/env';

/**
 * Builds the Express application without binding it to a port.
 *
 * Kept separate from `index.ts` so tests can mount it with supertest and drive the real
 * middleware chain, routes and error handler. Importing `index.ts` would call `listen()`
 * as a side effect and occupy a port, which is not something a test should do.
 */
export function createApp(): express.Express {
  // Fail fast on a missing or weak signing key. A misconfigured deployment should refuse to
  // start rather than come up and answer every authenticated request with a confusing error.
  assertCriticalConfiguration();

  const app = express();
  const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

  app.disable('x-powered-by');

  app.use(cors({ origin: FRONTEND_URL }));

  // Explicit body-size cap. Without this the only backstop is the framework default, and
  // oversized payloads are rejected with an unstructured error rather than a clean 413.
  app.use(express.json({ limit: '100kb' }));

  app.use('/api/goals', authenticate, goalRoutes)
  app.use('/api/users', userRoutes)
  app.use('/api/login', loginRoutes)
  app.use('/api/payment', authenticate, paymentRoutes)

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', message: '¡Servidor de Camino a la Meta funcionando!' });
  });

  // Unmatched routes and unhandled errors terminate here, so no request can ever escape
  // as an unstructured 5XX.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
