// vite.config.js di ROOT folder proyek

import { defineConfig } from 'vite';

export default defineConfig({
  root: 'UI', // Memberi tahu Vite bahwa folder UI adalah root project frontend
  build: {
    outDir: 'dist', 
    emptyOutDir: true,
  },
  server: {
    // Gunakan 0.0.0.0 untuk memastikan dapat diakses di Linux/Firewall
    host: '0.0.0.0', 
    strictPort: true,
    port: 5173,
    hmr: {
        protocol: 'ws',
        host: 'localhost', // HMR (WebSocket) tetap pakai localhost
    },
  }
});
