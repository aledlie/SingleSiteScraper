import React, { useState } from 'react';
import { Loader2, Search, Download, Globe, BarChart3, Settings, Database } from 'lucide-react';
import { EnhancedScraper, EnhancedScrapeOptions, EnhancedScrapeResult, AnalyticsInsights } from '../analytics/enhancedScraper';
import { SQLMagicConfig } from '../analytics/sqlMagicIntegration';
import { PerformanceAlert } from '../analytics/performanceMonitor';
import { ScrapeOptionsForm } from './ScrapeOptionsForm';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import type { AnalyticsConfig } from '../types';
import FormInput from './ui/FormInput';
import { ErrorAlert } from './ErrorAlert';
import { ProgressIndicator } from './ProgressBar';

const EnhancedWebScraper: React.FC = () => {
  const [url, setUrl] = useState('');
  const [options, setOptions] = useState<EnhancedScrapeOptions>({
    includeText: true,
    includeLinks: true,
    includeImages: true,
    includeMetadata: true,
    includeEvents: true,
    maxLinks: 100,
    maxImages: 10,
    maxTextElements: 200,
    maxEvents: 20,
    timeout: 30000,
    retryAttempts: 3,
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    enableSQLStorage: false,
    generateGraphML: true,
    generateSchemaOrg: true
  });

  const [analyticsConfig, setAnalyticsConfig] = useState<AnalyticsConfig>({
    enableAnalytics: true,
    enablePerformanceMonitoring: true,
    enableSQLStorage: false,
    generateGraphML: true,
    generateSchemaOrg: true,
    sqlConfig: {
      host: 'localhost',
      port: 5432,
      database: 'scraper_analytics'
    }
  });

  const [result, setResult] = useState<EnhancedScrapeResult | null>(null);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeView, setActiveView] = useState<'scraper' | 'analytics'>('scraper');

  const [enhancedScraper] = useState(() => new EnhancedScraper());

  const handleScrape = async () => {
    setIsLoading(true);
    setError('');
    setResult(null);
    setInsights(null);
    setAlerts([]);
    
    try {
      // Initialize SQL integration if enabled
      if (options.enableSQLStorage && analyticsConfig.sqlConfig) {
        setProgress('Initializing SQL connection...');
        const sqlInitialized = await enhancedScraper.initializeSQLIntegration(analyticsConfig.sqlConfig as SQLMagicConfig);
        if (!sqlInitialized) {
          setError('Failed to initialize SQL connection. Continuing without SQL storage.');
          options.enableSQLStorage = false;
        }
      }

      setProgress('Starting enhanced scraping...');
      const scrapeResult = await enhancedScraper.scrape(url, options, setProgress);
      
      if (scrapeResult.error) {
        setError(scrapeResult.error);
        return;
      }

      setResult(scrapeResult);

      // Generate insights if analytics are enabled
      if (options.enableAnalytics && scrapeResult.htmlGraph && scrapeResult.performanceMetrics) {
        setProgress('Generating insights...');
        const analyticsInsights = enhancedScraper.generateInsights(scrapeResult);
        setInsights(analyticsInsights);
      }

      // Get performance alerts
      if (options.enablePerformanceMonitoring) {
        const performanceMonitor = enhancedScraper.getPerformanceMonitor();
        const recentAlerts = performanceMonitor.getAlerts(undefined, 10);
        setAlerts(recentAlerts);
      }

      // Switch to analytics view if analytics are enabled
      if (options.enableAnalytics) {
        setActiveView('analytics');
      }

    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Unknown error during enhanced scraping');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async (format: 'json' | 'csv' | 'all' = 'json') => {
    try {
      if (format === 'all') {
        // Export multiple formats
        const jsonData = await enhancedScraper.exportAnalyticsData('json');
        const csvData = await enhancedScraper.exportAnalyticsData('csv');
        
        // Create zip-like export
        const exportData = {
          analytics: JSON.parse(jsonData),
          performance_csv: csvData,
          scrape_result: result,
          insights: insights
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `enhanced-scrape-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const data = await enhancedScraper.exportAnalyticsData(format);
        const mimeType = format === 'json' ? 'application/json' : 'text/csv';
        const extension = format === 'json' ? 'json' : 'csv';
        
        const blob = new Blob([data], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${Date.now()}.${extension}`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      setError(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="enhanced-scraper-container">
      {/* Header with View Toggle */}
      <div className="header-section">
        <div className="view-toggle">
          <button
            onClick={() => setActiveView('scraper')}
            className={`view-button ${activeView === 'scraper' ? 'active' : ''}`}
          >
            <Globe className="w-4 h-4" />
            Scraper
          </button>
          <button
            onClick={() => setActiveView('analytics')}
            className={`view-button ${activeView === 'analytics' ? 'active' : ''}`}
            disabled={!result || !insights}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>

      {activeView === 'scraper' && (
        <div className="scraper-view">
          <div className="border-card">
            <FormInput
              label="Website URL"
              placeholder="https://example.com"
              value={url}
              onChange={(val: string) => setUrl(val)}
              icon={<Globe className="w-5 h-5 text-gray-400" />}
              onEnter={handleScrape}
            />

            {/* Basic Options */}
            <div className="options-section">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="show-advanced-button"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </button>
              
              {showAdvanced && (
                <div className="advanced-options">
                  <ScrapeOptionsForm options={options} onChange={setOptions} />
                </div>
              )}
            </div>

            {/* Analytics Configuration */}
            <div className="analytics-section">
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="show-advanced-button"
              >
                <BarChart3 className="w-4 h-4" />
                {showAnalytics ? 'Hide' : 'Show'} Analytics Settings
              </button>
              
              {showAnalytics && (
                <div className="analytics-config">
                  <div className="config-grid">
                    <label className="config-item">
                      <input
                        type="checkbox"
                        checked={options.enableAnalytics}
                        onChange={(e) => setOptions({...options, enableAnalytics: e.target.checked})}
                      />
                      <span>Enable HTML Analysis</span>
                    </label>
                    
                    <label className="config-item">
                      <input
                        type="checkbox"
                        checked={options.enablePerformanceMonitoring}
                        onChange={(e) => setOptions({...options, enablePerformanceMonitoring: e.target.checked})}
                      />
                      <span>Performance Monitoring</span>
                    </label>
                    
                    <label className="config-item">
                      <input
                        type="checkbox"
                        checked={options.generateGraphML}
                        onChange={(e) => setOptions({...options, generateGraphML: e.target.checked})}
                      />
                      <span>Generate GraphML</span>
                    </label>
                    
                    <label className="config-item">
                      <input
                        type="checkbox"
                        checked={options.generateSchemaOrg}
                        onChange={(e) => setOptions({...options, generateSchemaOrg: e.target.checked})}
                      />
                      <span>Generate Schema.org</span>
                    </label>
                  </div>

                  {/* SQL Configuration */}
                  <div className="sql-config">
                    <label className="config-item">
                      <input
                        type="checkbox"
                        checked={options.enableSQLStorage}
                        onChange={(e) => setOptions({...options, enableSQLStorage: e.target.checked})}
                      />
                      <span>Enable SQL Storage</span>
                    </label>
                    
                    {options.enableSQLStorage && (
                      <div className="sql-settings">
                        <div className="sql-grid">
                          <FormInput
                            label="Host"
                            value={analyticsConfig.sqlConfig?.host || ''}
                            onChange={(val) => setAnalyticsConfig({
                              ...analyticsConfig,
                              sqlConfig: {...analyticsConfig.sqlConfig, host: val}
                            })}
                          />
                          <FormInput
                            label="Port"
                            value={analyticsConfig.sqlConfig?.port?.toString() || ''}
                            onChange={(val) => setAnalyticsConfig({
                              ...analyticsConfig,
                              sqlConfig: {...analyticsConfig.sqlConfig, port: parseInt(val) || 5432}
                            })}
                          />
                          <FormInput
                            label="Database"
                            value={analyticsConfig.sqlConfig?.database || ''}
                            onChange={(val) => setAnalyticsConfig({
                              ...analyticsConfig,
                              sqlConfig: {...analyticsConfig.sqlConfig, database: val}
                            })}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Scrape Button */}
            <button
              onClick={handleScrape}
              disabled={isLoading || !url}
              className="scrape-button enhanced"
            >
              {isLoading ? (
                <Loader2 className="scrape-button-icon-loading" />
              ) : (
                <Search className="scrape-button-icon" />
              )}
              {isLoading ? 'Processing...' : 'Enhanced Scrape'}
            </button>

            {/* Error and Progress */}
            {error && <ErrorAlert error={error} />}
            {isLoading && <ProgressIndicator isLoading={isLoading} progress={progress} />}

            {/* Results Summary */}
            {result && (
              <div className="results-summary">
                <div className="summary-stats">
                  <div className="stat-item">
                    <span className="stat-label">Objects:</span>
                    <span className="stat-value">{result.htmlGraph?.metadata.totalObjects || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Relationships:</span>
                    <span className="stat-value">{result.htmlGraph?.metadata.totalRelationships || 0}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Time:</span>
                    <span className="stat-value">
                      {((result.performanceMetrics?.scraping.totalTime || 0) / 1000).toFixed(1)}s
                    </span>
                  </div>
                  {result.performanceMetrics && (
                    <div className="stat-item">
                      <span className="stat-label">Complexity:</span>
                      <span className="stat-value">
                        {result.performanceMetrics.content.complexity.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Export Options */}
                <div className="export-options">
                  <button
                    onClick={() => handleExportData('json')}
                    className="export-button"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExportData('csv')}
                    className="export-button"
                  >
                    <Database className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExportData('all')}
                    className="export-button primary"
                  >
                    <Download className="w-4 h-4" />
                    Export All
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                  {insights && (
                    <button
                      onClick={() => setActiveView('analytics')}
                      className="action-button"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Analytics
                    </button>
                  )}
                  
                  {result.originalData && (
                    <button
                      onClick={() => {
                        const blob = new Blob(
                          [JSON.stringify({ ...result.originalData, exportedAt: new Date().toISOString() }, null, 2)],
                          { type: 'application/json' }
                        );
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `original-scrape-${Date.now()}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="action-button"
                    >
                      <Download className="w-4 h-4" />
                      Original Data
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeView === 'analytics' && (
        <div className="analytics-view">
          <AnalyticsDashboard 
            result={result || undefined} 
            insights={insights || undefined}
            alerts={alerts}
          />
        </div>
      )}
    </div>
  );
};

export default EnhancedWebScraper;