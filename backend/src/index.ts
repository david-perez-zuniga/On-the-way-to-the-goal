import { createApp } from './app';

// The process entry point stays deliberately thin: all wiring lives in `app.ts` so the
// same application object can be mounted by tests without binding a port.
const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
