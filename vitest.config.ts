// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

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
});
