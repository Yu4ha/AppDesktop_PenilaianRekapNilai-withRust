import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'UI',
  build: {
    outDir: 'dist', 
    emptyOutDir: true,
        rollupOptions: {
      input: {
        main: resolve(__dirname, 'UI/index.html'),
        absensi: resolve(__dirname, 'UI/index-absensi.html'),
        dataSiswa: resolve(__dirname, 'UI/index-dataSiswa.html'),
        kelulusan: resolve(__dirname, 'UI/index-kelulusan.html'),
        mapel: resolve(__dirname, 'UI/index-mapel.html'),
        penilaian: resolve(__dirname, 'UI/index-penilaian.html'),
        rekapNilai: resolve(__dirname, 'UI/index-rekapNilai.html'),
        pengguna: resolve(__dirname, 'UI/pengguna.html'),
      }
    }
  },
  server: {
    host: '0.0.0.0', 
    strictPort: true,
    port: 5173,
    hmr: {
        protocol: 'ws',
        host: 'localhost',
    },
  }
});