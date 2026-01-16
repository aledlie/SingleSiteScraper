import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['tests/**/*.{test,spec}.{ts,tsx}', 'src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', '**/*.d.ts', '**/*.config.*']
    }
  },
  plugins: [
    react(),
    // Sentry source map upload (only in production builds with auth token)
    process.env.SENTRY_AUTH_TOKEN && sentryVitePlugin({
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT || 'single-site-scraper',
      authToken: process.env.SENTRY_AUTH_TOKEN,
      sourcemaps: {
        filesToDeleteAfterUpload: ['**/*.js.map'],
      },
    }),
  ].filter(Boolean),
  build: {
    rollupOptions: {
      output: {
        // Safe chunk splitting - keeps React together to avoid initialization issues
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Keep ALL React packages together - critical for initialization order
            if (id.includes('react') || id.includes('scheduler')) {
              return 'react-vendor';
            }
            // Sentry - independent error tracking
            if (id.includes('@sentry')) {
              return 'sentry-vendor';
            }
            // HTML parser and dependencies - independent CommonJS
            if (id.includes('node-html-parser') ||
                id.includes('htmlparser2') ||
                id.includes('domhandler') ||
                id.includes('domutils') ||
                id.includes('css-select') ||
                id.includes('entities') ||
                id.includes('/he/')) {
              return 'parser-vendor';
            }
            // Icons - independent, tree-shakeable
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            // Date utilities - independent
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // All other vendor code stays in default vendor chunk
          }
          // Don't split app code - let Vite handle it naturally
          return undefined;
        }
      },
      treeshake: true
    },
    // Reduce chunk size warning threshold
    chunkSizeWarningLimit: 200,
    // Enable sourcemaps for debugging but smaller inline maps
    sourcemap: 'hidden',
    // Optimize minification
    minify: 'esbuild'
  },
  // Optimize deps for faster dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'date-fns', 'node-html-parser'],
    // Exclude Playwright and other Node.js-only dependencies
    exclude: ['playwright', 'playwright-core']
  },
  // Define external dependencies that shouldn't be bundled
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  // Configure externals for Node.js dependencies
  ssr: {
    external: ['playwright', 'playwright-core', 'chromium-bidi']
  }
});