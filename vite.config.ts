import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/// <reference path="./src/types/rollup__parseAst.d.ts" />
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
 resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
  },
});
