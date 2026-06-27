import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para que Express entienda JSON en el body de las peticiones
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '¡Servidor de Camino a la Meta funcionando!' });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
