import React from 'react';
import { Globe } from 'lucide-react';
import WebScraper from './components/WebScraper';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="main-content">
        <div className="header">
          <div className="logo">
            <Globe className="logo-icon" />
          </div>
          <h1 className="title">Web Scraper Pro</h1>
          <p className="subtitle">Extract data from any website using modern proxy and parsing methods.</p>
        </div>
        <WebScraper />
      </div>
    </div>
  );
};

export default App;

