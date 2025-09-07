import React, { useState, useCallback, useMemo } from 'react';
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

  // Memoized event handlers for better performance
  const handleActiveViewChange = useCallback((view: 'scraper' | 'analytics') => {
    setActiveView(view);
  }, []);

  const handleUrlChange = useCallback((val: string) => {
    setUrl(val);
  }, []);

  const handleShowAdvancedToggle = useCallback(() => {
    setShowAdvanced(prev => !prev);
  }, []);

  const handleShowAnalyticsToggle = useCallback(() => {
    setShowAnalytics(prev => !prev);
  }, []);

  const handleOptionsChange = useCallback((newOptions: EnhancedScrapeOptions) => {
    setOptions(newOptions);
  }, []);

  const handleAnalyticsConfigChange = useCallback((newConfig: AnalyticsConfig) => {
    setAnalyticsConfig(newConfig);
  }, []);

  // Memoized option toggle handlers
  const handleEnableAnalyticsToggle = useCallback((checked: boolean) => {
    setOptions(prev => ({ ...prev, enableAnalytics: checked }));
  }, []);

  const handlePerformanceMonitoringToggle = useCallback((checked: boolean) => {
    setOptions(prev => ({ ...prev, enablePerformanceMonitoring: checked }));
  }, []);

  const handleGenerateGraphMLToggle = useCallback((checked: boolean) => {
    setOptions(prev => ({ ...prev, generateGraphML: checked }));
  }, []);

  const handleGenerateSchemaOrgToggle = useCallback((checked: boolean) => {
    setOptions(prev => ({ ...prev, generateSchemaOrg: checked }));
  }, []);

  const handleSQLStorageToggle = useCallback((checked: boolean) => {
    setOptions(prev => ({ ...prev, enableSQLStorage: checked }));
  }, []);

  const handleScrape = useCallback(async () => {
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
  }, [url, options, analyticsConfig, enhancedScraper]);

  const handleExportData = useCallback(async (format: 'json' | 'csv' | 'all' = 'json') => {
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
  }, [enhancedScraper, result]);

  return (
    <div className="border-card">
      {/* Header with View Toggle */}
      <div className="mb-6">
        <div className="flex bg-gray-50 rounded-lg p-1 w-fit border border-gray-200 mx-auto">
          <button
            onClick={() => handleActiveViewChange('scraper')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'scraper' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Globe className="w-4 h-4" />
            Scraper
          </button>
          <button
            onClick={() => handleActiveViewChange('analytics')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'analytics' 
                ? 'bg-blue-500 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            disabled={!result || !insights}
          >
            <BarChart3 className="w-4 h-4" />
            Analytics
          </button>
        </div>
      </div>

      {activeView === 'scraper' && (
        <div className="scraper-view">
          <div className="border-card border border-white/20">
            <FormInput
              label="Website URL"
              placeholder="https://example.com"
              value={url}
              onChange={handleUrlChange}
              icon={<Globe className="w-5 h-5 text-gray-400" />}
              onEnter={handleScrape}
            />

            {/* Basic Options */}
            <div className="mb-4">
              <button
                onClick={handleShowAdvancedToggle}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <Settings className="w-4 h-4" />
                {showAdvanced ? 'Hide' : 'Show'} Advanced Settings
              </button>
            
              {showAdvanced && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <ScrapeOptionsForm options={options} onChange={handleOptionsChange} />
                </div>
              )}
            </div>

            {/* Analytics Configuration */}
            <div className="mb-6">
              <button
                onClick={handleShowAnalyticsToggle}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
              >
                <BarChart3 className="w-4 h-4" />
                {showAnalytics ? 'Hide' : 'Show'} Analytics Settings
              </button>
              
              {showAnalytics && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={options.enableAnalytics}
                        onChange={(e) => handleEnableAnalyticsToggle(e.target.checked)}
                      />
                      <span>Enable HTML Analysis</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={options.enablePerformanceMonitoring}
                        onChange={(e) => handlePerformanceMonitoringToggle(e.target.checked)}
                      />
                      <span>Performance Monitoring</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={options.generateGraphML}
                        onChange={(e) => handleGenerateGraphMLToggle(e.target.checked)}
                      />
                      <span>Generate GraphML</span>
                    </label>
                    
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={options.generateSchemaOrg}
                        onChange={(e) => handleGenerateSchemaOrgToggle(e.target.checked)}
                      />
                      <span>Generate Schema.org</span>
                    </label>
                  </div>

                  {/* SQL Configuration */}
                  <div className="border-t border-gray-200 pt-4">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={options.enableSQLStorage}
                        onChange={(e) => handleSQLStorageToggle(e.target.checked)}
                      />
                      <span>Enable SQL Storage</span>
                    </label>
                    
                    {options.enableSQLStorage && (
                      <div className="sql-settings">
                        <div className="grid grid-cols-3 gap-4">
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
              className={`scrape-button ${isLoading || !url ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              {isLoading ? 'Processing...' : 'Enhanced Scrape'}
            </button>

            {/* Error and Progress */}
            {error && <ErrorAlert error={error} />}
            {isLoading && <ProgressIndicator isLoading={isLoading} progress={progress} />}

            {/* Results Summary */}
            {result && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <span className="stat-label">Objects:</span>
                    <span className="stat-value">{result.htmlGraph?.metadata.totalObjects || 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="stat-label">Relationships:</span>
                    <span className="stat-value">{result.htmlGraph?.metadata.totalRelationships || 0}</span>
                  </div>
                  <div className="text-center">
                    <span className="stat-label">Time:</span>
                    <span className="stat-value">
                      {((result.performanceMetrics?.scraping.totalTime || 0) / 1000).toFixed(1)}s
                    </span>
                  </div>
                  {result.performanceMetrics && (
                    <div className="text-center">
                      <span className="stat-label">Complexity:</span>
                      <span className="stat-value">
                        {result.performanceMetrics.content.complexity.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Export Options */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => handleExportData('json')}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export JSON
                  </button>
                  <button
                    onClick={() => handleExportData('csv')}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors text-sm"
                  >
                    <Database className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => handleExportData('all')}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Export All
                  </button>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  {insights && (
                    <button
                      onClick={() => handleActiveViewChange('analytics')}
                      className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors text-sm"
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
                      className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors text-sm"
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