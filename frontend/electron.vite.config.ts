import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // NOTE: Main process configuration
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'electron/main/index.ts'),
        output: {
          entryFileNames: 'index.js',
        },
      },
    },
  },

  // NOTE: Preload scripts configuration
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: path.resolve(__dirname, 'electron/preload/index.ts'),
        output: {
          entryFileNames: 'index.js',
        },
      },
    },
  },

  // NOTE: Renderer process configuration (React app)
  renderer: {
    // NOTE: Root directory for renderer files (current directory, not src/renderer)
    root: __dirname,

    plugins: [react()],

    // NOTE: Reuse existing aliases from vite.config.ts
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        '@shared': path.resolve(__dirname, '../shared'),
      },
    },

    // NOTE: Build configuration
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        input: path.resolve(__dirname, 'index.html'),
      },
    },
  },
});
