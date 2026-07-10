import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { goalRoutes } from './infrastructure/routes/goalRoutes';
import { userRoutes } from './infrastructure/routes/userRoutes';
import { loginRoutes } from './infrastructure/routes/loginRoutes';
import { paymentRoutes } from './infrastructure/routes/paymentRoutes';
import { authenticate } from './infrastructure/middlewares/authMiddleware';

const app = express();
const PORT = process.env.PORT || 3000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

app.use('/api/goals', authenticate, goalRoutes)
app.use('/api/users', userRoutes)
app.use('/api/login', loginRoutes)
app.use('/api/payment', authenticate, paymentRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '¡Servidor de Camino a la Meta funcionando!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
