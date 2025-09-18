import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración de Vite para el frontend React. Incluye el plugin de React
// para habilitar JSX y hot reloading.
export default defineConfig({
  plugins: [react()],
});
