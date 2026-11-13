import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// `base: './'` makes every asset URL relative, so the same build works on
// Vercel (served from `/`) and on GitHub Pages (served from `/<repo-name>/`).
// Routing uses the URL hash (`#/level/1`), so no server rewrites are required.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
  },
});
