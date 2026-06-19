import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: path.resolve(__dirname, 'backend/public/app'),
    emptyDir: false,
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index-v7.js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/generate': 'http://localhost:8080',
      '/batch-generate': 'http://localhost:8080',
      '/refine': 'http://localhost:8080',
      '/analyze': 'http://localhost:8080',
      '/translate': 'http://localhost:8080',
      '/api': 'http://localhost:8080',
      '/health': 'http://localhost:8080',
    },
  },
});
