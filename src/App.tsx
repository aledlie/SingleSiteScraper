import React, { useState, Suspense, lazy } from 'react';
import { Globe, Zap, BarChart3 } from 'lucide-react';

// Lazy load components for better performance
const WebScraper = lazy(() => import('./components/WebScraper'));
const EnhancedWebScraper = lazy(() => import('./components/EnhancedWebScraper'));
const FisterraVisualizationDashboard = lazy(() => import('./components/FisterraVisualizationDashboard').then(module => ({ default: module.FisterraVisualizationDashboard })));

type ScraperMode = 'basic' | 'enhanced' | 'visualization';

const App: React.FC = () => {
  const [mode, setMode] = useState<ScraperMode>('enhanced');

  return (
    <div className="app-container">
      <div className="main-content">
        <div className="header">
          <div className="logo">
            <Globe className="logo-icon" />
          </div>
          <h1 className="title">Web Scraper Pro</h1>
          <p className="subtitle">
            Extract data from any website with advanced analytics and graph modeling
          </p>
          
          {/* Mode Toggle */}
          <div className="mode-toggle">
            <button
              onClick={() => setMode('basic')}
              className={`mode-button ${
                mode === 'basic' ? 'active' : ''
              }`}
            >
              <Globe className="w-4 h-4" />
              Basic Scraper
            </button>
            <button
              onClick={() => setMode('enhanced')}
              className={`mode-button ${
                mode === 'enhanced' ? 'active' : ''
              }`}
            >
              <Zap className="w-4 h-4" />
              Enhanced Analytics
            </button>
            <button
              onClick={() => setMode('visualization')}
              className={`mode-button ${
                mode === 'visualization' ? 'active' : ''
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Example Analytics Page
            </button>
          </div>
        </div>
        
        <Suspense fallback={
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '40px',
            color: '#6b7280' 
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '8px' }}>⚡</div>
              Loading scraper...
            </div>
          </div>
        }>
          {mode === 'basic' && <WebScraper />}
          {mode === 'enhanced' && <EnhancedWebScraper />}
          {mode === 'visualization' && <FisterraVisualizationDashboard />}
        </Suspense>
        
        <footer className="mt-12 border-t border-gray-700 py-8">
          <div className="max-w-4xl mx-auto px-6">
            <p className="text-center text-gray-400 mb-6">&copy; 2024 Web Scraper Pro. Powered by RepoViz MCP Integration.</p>
            <div className="flex justify-center gap-8">
              <div className="flex items-center gap-2 text-gray-400">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm">HTML Analysis</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Globe className="w-4 h-4" />
                <span className="text-sm">Graph Modeling</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Zap className="w-4 h-4" />
                <span className="text-sm">SQLMagic Storage</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;

