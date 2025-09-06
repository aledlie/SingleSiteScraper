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
              className={`mode-button ${mode === 'basic' ? 'active' : ''}`}
            >
              <Globe className="w-4 h-4" />
              Basic Scraper
            </button>
            <button
              onClick={() => setMode('enhanced')}
              className={`mode-button ${mode === 'enhanced' ? 'active' : ''}`}
            >
              <Zap className="w-4 h-4" />
              Enhanced Analytics
            </button>
            <button
              onClick={() => setMode('visualization')}
              className={`mode-button ${mode === 'visualization' ? 'active' : ''}`}
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
        
        <footer className="app-footer">
          <div className="footer-content">
            <p>&copy; 2024 Web Scraper Pro. Powered by RepoViz MCP Integration.</p>
            <div className="footer-features">
              <div className="feature-item">
                <BarChart3 className="w-4 h-4" />
                <span>HTML Analysis</span>
              </div>
              <div className="feature-item">
                <Globe className="w-4 h-4" />
                <span>Graph Modeling</span>
              </div>
              <div className="feature-item">
                <Zap className="w-4 h-4" />
                <span>SQLMagic Storage</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;

