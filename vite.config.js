import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  port: 5173,  // or any free port
    host: '127.0.0.1',
    server: {
      proxy: {
        '/api': 'http://localhost:8000'
      }
    }
});
