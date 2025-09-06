import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'date-fns'],
          
          // Analytics and performance modules
          'analytics': [
            './src/analytics/enhancedScraper.ts',
            './src/analytics/performanceMonitor.ts',
            './src/analytics/sqlMagicIntegration.ts',
            './src/analytics/htmlObjectAnalyzer.ts'
          ],
          
          // Visualization components
          'visualizations': [
            './src/visualizations/DatabaseSchemaViz.tsx',
            './src/visualizations/MetricsCharts.tsx',
            './src/visualizations/NetworkGraphViz.tsx'
          ],
          
          // Large dashboard components
          'dashboards': [
            './src/components/AnalyticsDashboard.tsx',
            './src/components/FisterraVisualizationDashboard.tsx'
          ]
        }
      }
    },
    // Reduce chunk size warning threshold
    chunkSizeWarningLimit: 300,
    // Enable sourcemaps for debugging but smaller inline maps
    sourcemap: 'hidden'
  },
  // Optimize deps for faster dev server
  optimizeDeps: {
    include: ['react', 'react-dom', 'lucide-react', 'date-fns', 'node-html-parser']
  }
});