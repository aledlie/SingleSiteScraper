import React from 'react';
import { Globe } from 'lucide-react';
import WebScraper from './components/WebScraper';

const App: React.FC = () => {
  return (
    <div className="min-h-screen px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-full mb-4">
            <Globe className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Web Scraper Pro</h1>
          <p className="text-gray-600">Extract data from any website using modern proxy and parsing methods.</p>
        </div>
        <WebScraper />
      </div>
    </div>
  );
};

export default App;

