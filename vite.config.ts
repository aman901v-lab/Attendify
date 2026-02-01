
import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  base: './', // Critical for GitHub Pages to find assets in sub-folders
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: '/index.html'
    }
  },
  server: {
    port: 3000
  }
});
