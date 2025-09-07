import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('lucide-react') || id.includes('date-fns')) {
              return 'ui-vendor';
            }
            if (id.includes('node-html-parser')) {
              return 'parser-vendor';
            }
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
      // Enable tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        unknownGlobalSideEffects: false
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