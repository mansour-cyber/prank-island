import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Dev/build use dev.html as the template. The production build is copied
// to the repo root (index.html + assets/) by `npm run deploy:pages`, so the
// game is served directly from GitHub Pages (branch / root).
export default defineConfig({
  base: './',
  server: { host: true, port: 5173, open: '/dev.html' },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'dev.html'),
        three: resolve(__dirname, 'dev3d.html'),
      },
    },
  },
});
