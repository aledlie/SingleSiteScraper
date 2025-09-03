import React, { useState } from 'react';
import { BarChart3, Network, Database, Activity, TrendingUp, AlertTriangle, Table } from 'lucide-react';
import { EnhancedScrapeResult, AnalyticsInsights } from '../analytics/enhancedScraper';
import { PerformanceAlert } from '../analytics/performanceMonitor';
import { DatabaseSchemaViz } from '../visualizations/DatabaseSchemaViz';
import { SQLMagicIntegration } from '../analytics/sqlMagicIntegration';

interface AnalyticsDashboardProps {
  result?: EnhancedScrapeResult;
  insights?: AnalyticsInsights;
  alerts?: PerformanceAlert[];
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  result, 
  insights,
  alerts = []
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'graph' | 'performance' | 'schema' | 'database'>('overview');

  if (!result || !insights) {
    return (
      <div className="analytics-dashboard-empty">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500 text-center">No analytics data available</p>
        <p className="text-sm text-gray-400 text-center mt-2">
          Enable analytics in advanced settings to see detailed insights
        </p>
      </div>
    );
  }

  const { htmlGraph, performanceMetrics } = result;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'graph', label: 'Graph Analysis', icon: Network },
    { id: 'performance', label: 'Performance', icon: Activity },
    { id: 'schema', label: 'Schema.org', icon: Database },
    { id: 'database', label: 'Database Schema', icon: Table }
  ];

  return (
    <div className="analytics-dashboard">
      {/* Alert Banner */}
      {alerts.length > 0 && (
        <div className="alert-banner">
          <AlertTriangle className="w-5 h-5 text-yellow-600" />
          <div className="alert-content">
            <p className="text-sm font-medium text-yellow-800">
              {alerts.length} alert{alerts.length > 1 ? 's' : ''} detected
            </p>
            <div className="alerts-list">
              {alerts.slice(0, 3).map(alert => (
                <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                  <span className="alert-category">{alert.category}</span>
                  <span className="alert-message">{alert.message}</span>
                  <span className="alert-value">{alert.value.toFixed(0)}</span>
                </div>
              ))}
              {alerts.length > 3 && (
                <p className="text-xs text-gray-600">...and {alerts.length - 3} more</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            {/* Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-header">
                  <Network className="w-6 h-6 text-blue-600" />
                  <h3>Objects</h3>
                </div>
                <div className="summary-value">{htmlGraph?.metadata.totalObjects || 0}</div>
                <div className="summary-label">HTML Elements</div>
              </div>

              <div className="summary-card">
                <div className="summary-header">
                  <BarChart3 className="w-6 h-6 text-green-600" />
                  <h3>Relationships</h3>
                </div>
                <div className="summary-value">{htmlGraph?.metadata.totalRelationships || 0}</div>
                <div className="summary-label">Element Connections</div>
              </div>

              <div className="summary-card">
                <div className="summary-header">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                  <h3>Complexity</h3>
                </div>
                <div className="summary-value">
                  {insights.complexityAnalysis.totalComplexity.toFixed(1)}
                </div>
                <div className="summary-label">Complexity Score</div>
              </div>

              <div className="summary-card">
                <div className="summary-header">
                  <Activity className="w-6 h-6 text-red-600" />
                  <h3>Performance</h3>
                </div>
                <div className="summary-value">
                  {(performanceMetrics?.scraping.totalTime || 0) / 1000}s
                </div>
                <div className="summary-label">Total Time</div>
              </div>
            </div>

            {/* Object Type Distribution */}
            <div className="distribution-section">
              <h3>Object Type Distribution</h3>
              <div className="distribution-chart">
                {Object.entries(insights.objectTypeDistribution).map(([type, count]) => (
                  <div key={type} className="distribution-bar">
                    <div className="distribution-label">
                      <span className="type-name">{type}</span>
                      <span className="type-count">{count}</span>
                    </div>
                    <div className="distribution-progress">
                      <div 
                        className="distribution-fill" 
                        style={{ 
                          width: `${(count / Math.max(...Object.values(insights.objectTypeDistribution))) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="recommendations-section">
              <h3>Recommendations</h3>
              <div className="recommendations-list">
                {insights.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    <div className="recommendation-icon">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <p>{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'graph' && (
          <div className="graph-tab">
            <div className="graph-stats">
              <div className="graph-stat">
                <span className="stat-label">Max Depth:</span>
                <span className="stat-value">{insights.complexityAnalysis.maxDepth}</span>
              </div>
              <div className="graph-stat">
                <span className="stat-label">Avg Depth:</span>
                <span className="stat-value">{insights.complexityAnalysis.averageDepth.toFixed(1)}</span>
              </div>
              <div className="graph-stat">
                <span className="stat-label">Relationship Density:</span>
                <span className="stat-value">{insights.complexityAnalysis.relationshipDensity.toFixed(2)}</span>
              </div>
            </div>

            {/* Export Options */}
            <div className="export-section">
              <h3>Export Options</h3>
              <div className="export-buttons">
                {result.graphML && (
                  <button
                    onClick={() => {
                      const blob = new Blob([result.graphML!], { type: 'application/xml' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `graph-${Date.now()}.graphml`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="export-button"
                  >
                    <Network className="w-4 h-4" />
                    Download GraphML
                  </button>
                )}
                <button
                  onClick={() => {
                    const blob = new Blob(
                      [JSON.stringify(insights, null, 2)], 
                      { type: 'application/json' }
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `insights-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="export-button"
                >
                  <Database className="w-4 h-4" />
                  Export Insights
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && performanceMetrics && (
          <div className="performance-tab">
            <div className="performance-grid">
              <div className="performance-card">
                <h4>Scraping Times</h4>
                <div className="performance-metrics">
                  <div className="metric-row">
                    <span>Total Time:</span>
                    <span>{performanceMetrics.scraping.totalTime}ms</span>
                  </div>
                  <div className="metric-row">
                    <span>Fetch Time:</span>
                    <span>{performanceMetrics.scraping.fetchTime}ms</span>
                  </div>
                  <div className="metric-row">
                    <span>Analysis Time:</span>
                    <span>{performanceMetrics.scraping.analysisTime}ms</span>
                  </div>
                  <div className="metric-row">
                    <span>Retry Attempts:</span>
                    <span>{performanceMetrics.scraping.retryAttempts}</span>
                  </div>
                </div>
              </div>

              <div className="performance-card">
                <h4>Content Metrics</h4>
                <div className="performance-metrics">
                  <div className="metric-row">
                    <span>HTML Size:</span>
                    <span>{(performanceMetrics.content.htmlSize / 1024).toFixed(1)}KB</span>
                  </div>
                  <div className="metric-row">
                    <span>Objects:</span>
                    <span>{performanceMetrics.content.objectCount}</span>
                  </div>
                  <div className="metric-row">
                    <span>Relationships:</span>
                    <span>{performanceMetrics.content.relationshipCount}</span>
                  </div>
                  <div className="metric-row">
                    <span>Max Depth:</span>
                    <span>{performanceMetrics.content.maxDepth}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'schema' && (
          <div className="schema-tab">
            {result.schemaOrgData ? (
              <div className="schema-content">
                <div className="schema-header">
                  <h3>Schema.org Structured Data</h3>
                  <button
                    onClick={() => {
                      const blob = new Blob(
                        [JSON.stringify(result.schemaOrgData, null, 2)], 
                        { type: 'application/json' }
                      );
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `schema-org-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="export-button small"
                  >
                    Export Schema
                  </button>
                </div>
                <pre className="schema-code">
                  {JSON.stringify(result.schemaOrgData, null, 2)}
                </pre>
              </div>
            ) : (
              <div className="schema-empty">
                <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-center">No schema.org data available</p>
                <p className="text-sm text-gray-400 text-center mt-2">
                  Enable schema.org generation in advanced settings
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'database' && (
          <div className="database-tab">
            <div className="database-header" style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '20px',
              padding: '16px',
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb'
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
                  SQLMagic Database Schema
                </h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>
                  Visual representation of the database structure for storing scraping analytics
                </p>
              </div>
            </div>
            
            <div style={{ 
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '8px',
              position: 'relative'
            }}>
              <DatabaseSchemaViz
                tables={new SQLMagicIntegration({
                  host: 'localhost',
                  port: 5432,
                  database: 'scraper_analytics'
                }).getDatabaseSchema()}
                width={1100}
                height={700}
                onExport={() => {
                  // Custom export handler for database schema
                  const schemaJson = {
                    version: '1.0',
                    database: 'scraper_analytics',
                    description: 'SQLMagic database schema for web scraping analytics',
                    tables: new SQLMagicIntegration({
                      host: 'localhost',
                      port: 5432,
                      database: 'scraper_analytics'
                    }).getDatabaseSchema(),
                    relationships: [
                      { from: 'html_objects', to: 'html_graphs', type: 'many_to_one' },
                      { from: 'html_relationships', to: 'html_graphs', type: 'many_to_one' },
                      { from: 'html_relationships', to: 'html_objects', type: 'many_to_many' },
                      { from: 'schema_org_data', to: 'html_graphs', type: 'many_to_one' }
                    ],
                    exported_at: new Date().toISOString()
                  };
                  
                  const blob = new Blob([JSON.stringify(schemaJson, null, 2)], { 
                    type: 'application/json' 
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `sqlmagic-database-schema-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              />
            </div>

            {/* Schema Information Panel */}
            <div style={{
              marginTop: '20px',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <Database className="w-5 h-5 text-blue-600" />
                  Schema Overview
                </h4>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Tables:</strong> {new SQLMagicIntegration({
                      host: 'localhost',
                      port: 5432,
                      database: 'scraper_analytics'
                    }).getDatabaseSchema().length}
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Primary Purpose:</strong> Store and analyze web scraping results
                  </div>
                  <div>
                    <strong>Key Features:</strong> HTML structure analysis, performance metrics, relationship modeling
                  </div>
                </div>
              </div>

              <div style={{
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <h4 style={{ 
                  margin: '0 0 12px 0', 
                  fontSize: '16px', 
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  Data Flow
                </h4>
                <div style={{ fontSize: '14px', color: '#6b7280' }}>
                  <div style={{ marginBottom: '6px' }}>1. <strong>html_graphs</strong> - Main analysis records</div>
                  <div style={{ marginBottom: '6px' }}>2. <strong>html_objects</strong> - Individual HTML elements</div>
                  <div style={{ marginBottom: '6px' }}>3. <strong>html_relationships</strong> - Element connections</div>
                  <div style={{ marginBottom: '6px' }}>4. <strong>performance_metrics</strong> - Execution data</div>
                  <div>5. <strong>schema_org_data</strong> - Structured metadata</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};