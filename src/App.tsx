import React, { useState } from 'react';
import { Globe, Zap, BarChart3 } from 'lucide-react';
import WebScraper from './components/WebScraper';
import EnhancedWebScraper from './components/EnhancedWebScraper';
import { FisterraVisualizationDashboard } from './components/FisterraVisualizationDashboard';

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
              Fisterra Analysis
            </button>
          </div>
        </div>
        
        {mode === 'basic' && <WebScraper />}
        {mode === 'enhanced' && <EnhancedWebScraper />}
        {mode === 'visualization' && <FisterraVisualizationDashboard />}
        
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

