import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // sourcemap: false, // Desactiva la generación de mapas de origen, los mensajes amarillos en consola
  },
});
