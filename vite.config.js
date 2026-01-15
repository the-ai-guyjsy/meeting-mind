import { defineConfig } from 'vite';

export default defineConfig({
  // Root is the project directory (where index.html is)
  root: '.',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 8080
  }
});
