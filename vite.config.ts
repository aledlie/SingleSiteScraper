import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { configDefaults } from 'vitest';

/// <reference path="./src/types/rollup__parseAst.d.ts" />
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom', // For DOM-related tests (e.g., cheerio)
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8', // or 'istanbul' if preferred
      reporter: ['text', 'html'],
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
});
