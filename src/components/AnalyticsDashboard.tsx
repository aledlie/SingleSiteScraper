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

interface DonutChartProps {
  data: Array<{ label: string; value: number; color: string }>;
  size: number;
  centerText?: string;
}

const DonutChart: React.FC<DonutChartProps> = ({ data, size, centerText }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  const radius = size / 2 - 10;
  const strokeWidth = 20;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
          const strokeDashoffset = -cumulativePercentage / 100 * circumference;
          
          cumulativePercentage += percentage;

          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={normalizedRadius}
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              fill="transparent"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: '50% 50%'
              }}
            />
          );
        })}
      </svg>
      
      {centerText && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#374151'
        }}>
          {centerText}
        </div>
      )}
    </div>
  );
};

interface ChartBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  percentage?: number;
}

const ChartBar: React.FC<ChartBarProps> = ({ label, value, maxValue, color, percentage }) => (
  <div className="chart-bar-item" style={{ marginBottom: '12px' }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '4px',
      fontSize: '14px'
    }}>
      <span style={{ fontWeight: '500' }}>{label}</span>
      <span style={{ color: '#666' }}>
        {percentage !== undefined ? `${percentage.toFixed(1)}%` : value}
      </span>
    </div>
    <div style={{
      width: '100%',
      height: '8px',
      backgroundColor: '#f3f4f6',
      borderRadius: '4px',
      overflow: 'hidden'
    }}>
      <div style={{
        width: `${Math.min(100, (value / maxValue) * 100)}%`,
        height: '100%',
        backgroundColor: color,
        transition: 'width 0.3s ease'
      }} />
    </div>
  </div>
);

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

            {/* Enhanced Object Type Distribution */}
            <div className="chart-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '20px',
                color: '#374151'
              }}>
                Element Type Distribution
              </h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <DonutChart 
                  data={(() => {
                    const typeDistribution = insights.objectTypeDistribution;
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
                    return Object.entries(typeDistribution).map(([type, count], index) => ({
                      label: type,
                      value: count,
                      color: colors[index % colors.length]
                    }));
                  })()} 
                  size={200}
                  centerText={`${Object.keys(insights.objectTypeDistribution).length} Types`}
                />
                
                <div className="chart-legend" style={{ flex: 1 }}>
                  {(() => {
                    const typeDistribution = insights.objectTypeDistribution;
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
                    return Object.entries(typeDistribution).map(([type, count], index) => (
                      <div key={type} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px',
                        padding: '8px',
                        backgroundColor: '#f9fafb',
                        borderRadius: '4px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{
                            width: '12px',
                            height: '12px',
                            backgroundColor: colors[index % colors.length],
                            marginRight: '12px',
                            borderRadius: '2px'
                          }}></div>
                          <span style={{ textTransform: 'capitalize', fontSize: '14px' }}>
                            {type}
                          </span>
                        </div>
                        <span style={{ fontWeight: '600', color: '#374151' }}>
                          {count}
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="chart-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '20px',
                color: '#374151'
              }}>
                Quality Metrics
              </h3>
              
              <ChartBar
                label="Structured Data Coverage"
                value={insights.qualityMetrics?.structuredDataCoverage * 100 || 0}
                maxValue={100}
                color="#10b981"
                percentage={insights.qualityMetrics?.structuredDataCoverage * 100 || 0}
              />
              
              <ChartBar
                label="Accessibility Score"
                value={insights.qualityMetrics?.accessibilityScore * 100 || 0}
                maxValue={100}
                color="#3b82f6"
                percentage={insights.qualityMetrics?.accessibilityScore * 100 || 0}
              />
              
              <ChartBar
                label="Semantic Richness"
                value={insights.qualityMetrics?.semanticRichness * 100 || 0}
                maxValue={100}
                color="#f59e0b"
                percentage={insights.qualityMetrics?.semanticRichness * 100 || 0}
              />
            </div>

            {/* Performance Breakdown */}
            <div className="chart-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '20px',
                color: '#374151'
              }}>
                Performance Breakdown
              </h3>
              
              <ChartBar
                label="Fetch Time"
                value={result.performanceMetrics?.scraping.fetchTime || 0}
                maxValue={result.performanceMetrics?.scraping.totalTime || 1}
                color="#ef4444"
              />
              
              <ChartBar
                label="Parse Time"
                value={result.performanceMetrics?.scraping.parseTime || 0}
                maxValue={result.performanceMetrics?.scraping.totalTime || 1}
                color="#f59e0b"
              />
              
              <ChartBar
                label="Analysis Time"
                value={result.performanceMetrics?.scraping.analysisTime || 0}
                maxValue={result.performanceMetrics?.scraping.totalTime || 1}
                color="#10b981"
              />
              
              <div style={{
                marginTop: '16px',
                padding: '12px',
                backgroundColor: '#f3f4f6',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#374151'
              }}>
                <strong>Efficiency:</strong> {((result.performanceMetrics?.scraping.totalTime || 0) > 0 ? (result.htmlGraph.metadata.totalObjects / ((result.performanceMetrics?.scraping.totalTime || 1) / 1000)).toFixed(1) : '0')} elements/second
              </div>
            </div>

            {/* Content Analysis */}
            <div className="chart-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                marginBottom: '20px',
                color: '#374151'
              }}>
                Content Analysis
              </h3>
              
              <div className="content-metrics" style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div className="metric-item">
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                    {((result.performanceMetrics?.content.htmlSize || 0) / 1024).toFixed(1)}KB
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>HTML Size</div>
                </div>
                
                <div className="metric-item">
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                    {insights.complexityAnalysis.relationshipDensity.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Relationship Density</div>
                </div>
                
                <div className="metric-item">
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b' }}>
                    {insights.complexityAnalysis.averageDepth.toFixed(1)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Average Depth</div>
                </div>
                
                <div className="metric-item">
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    {result.htmlGraph.metadata.totalRelationships}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Relationships</div>
                </div>
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