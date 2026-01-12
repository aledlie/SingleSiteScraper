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
        manualChunks: (id) => {
          // Vendor libraries - split large deps into separate chunks
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react-dom')) {
              return 'react-dom-vendor';
            }
            if (id.includes('/react/') || id.includes('react/')) {
              return 'react-vendor';
            }
            // Sentry error tracking (large)
            if (id.includes('@sentry')) {
              return 'sentry-vendor';
            }
            // UI libraries
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // HTML parser
            if (id.includes('node-html-parser') || id.includes('he/') || id.includes('css-select') || id.includes('domhandler') || id.includes('domutils') || id.includes('htmlparser2')) {
              return 'parser-vendor';
            }
            // Remaining small vendor deps
            return 'vendor';
          }
          
          // Large scraping modules
          if (id.includes('scraper/')) {
            return 'scraper';
          }
          
          // Analytics and performance modules
          if (id.includes('analytics/')) {
            return 'analytics';
          }
          
          // Visualization components
          if (id.includes('visualizations/')) {
            return 'visualizations';
          }
          
          // Large dashboard components
          if (id.includes('AnalyticsDashboard') || id.includes('FisterraVisualizationDashboard')) {
            return 'dashboards';
          }
          
          // Utils and smaller components
          if (id.includes('utils/') || id.includes('types/')) {
            return 'utils';
          }
        }
      },
      // Enable tree shaking (keep moduleSideEffects true for CommonJS compat)
      treeshake: {
        propertyReadSideEffects: false
      }
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