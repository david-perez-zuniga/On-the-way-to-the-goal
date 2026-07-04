import 'dotenv/config';
import express from 'express';
import { goalRoutes } from './infrastructure/routes/goalRoutes';
import { userRoutes } from './infrastructure/routes/userRoutes';
import { loginRoutes } from './infrastructure/routes/loginRoutes';
import { paymentRoutes } from './infrastructure/routes/paymentRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para que Express entienda JSON en el body de las peticiones
app.use(express.json());

app.use('/api/goals', goalRoutes)
app.use('/api/users', userRoutes)
app.use('/api/login', loginRoutes)
app.use('/api/payment', paymentRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '¡Servidor de Camino a la Meta funcionando!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
