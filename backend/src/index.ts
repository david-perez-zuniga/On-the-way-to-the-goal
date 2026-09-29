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

// Fail fast on a missing or weak signing key. A misconfigured deployment should refuse to
// start rather than come up and answer every authenticated request with a confusing error.
assertCriticalConfiguration();

const app = express();
const PORT = process.env.PORT || 3000;
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

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
