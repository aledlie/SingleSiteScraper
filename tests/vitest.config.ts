// vite.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/src/test-setup.ts'],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'src/utils/events/eventParser.test.ts', // Uses custom test runner, not vitest
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
    typecheck: {
      tsconfig: './tsconfig.json',
      checker: 'tsc',
      enabled: true,
    },
  },
});
