import React from 'react';
import { AnalyticsInsights } from '../analytics/enhancedScraper';
import { PerformanceMetrics } from '../analytics/performanceMonitor';

interface MetricsChartsProps {
  insights: AnalyticsInsights;
  performanceMetrics: PerformanceMetrics;
  className?: string;
}

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

export const MetricsCharts: React.FC<MetricsChartsProps> = ({
  insights,
  performanceMetrics,
  className = ""
}) => {
  const typeDistribution = insights.objectTypeDistribution;
  const _maxTypeCount = Math.max(...Object.values(typeDistribution));

  const qualityMetrics = insights.qualityMetrics;
  const performanceSummary = insights.performanceSummary;

  // Prepare donut chart data
  const typeChartData = Object.entries(typeDistribution).map(([type, count], index) => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16'];
    return {
      label: type,
      value: count,
      color: colors[index % colors.length]
    };
  });

  return (
    <div className={`metrics-charts ${className}`}>
      {/* Key Performance Indicators */}
      <div className="kpi-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div className="kpi-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px' }}>
            {Object.values(typeDistribution).reduce((sum, count) => sum + count, 0)}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase' }}>
            Total Elements
          </div>
        </div>

        <div className="kpi-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
            {insights.complexityAnalysis.totalComplexity.toFixed(1)}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase' }}>
            Complexity Score
          </div>
        </div>

        <div className="kpi-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#f59e0b', marginBottom: '8px' }}>
            {(performanceMetrics.scraping.totalTime / 1000).toFixed(1)}s
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase' }}>
            Processing Time
          </div>
        </div>

        <div className="kpi-card" style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#8b5cf6', marginBottom: '8px' }}>
            {insights.complexityAnalysis.maxDepth}
          </div>
          <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'uppercase' }}>
            Max DOM Depth
          </div>
        </div>
      </div>

      <div className="charts-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '24px'
      }}>
        {/* Object Type Distribution */}
        <div className="chart-card" style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
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
              data={typeChartData} 
              size={200}
              centerText={`${typeChartData.length} Types`}
            />
            
            <div className="chart-legend" style={{ flex: 1 }}>
              {typeChartData.map(item => (
                <div key={item.label} style={{
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
                      backgroundColor: item.color,
                      marginRight: '12px',
                      borderRadius: '2px'
                    }}></div>
                    <span style={{ textTransform: 'capitalize', fontSize: '14px', color: '#1f2937' }}>
                      {item.label}
                    </span>
                  </div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Quality Metrics */}
        <div className="chart-card" style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
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
            value={qualityMetrics.structuredDataCoverage * 100}
            maxValue={100}
            color="#10b981"
            percentage={qualityMetrics.structuredDataCoverage * 100}
          />
          
          <ChartBar
            label="Accessibility Score"
            value={qualityMetrics.accessibilityScore * 100}
            maxValue={100}
            color="#3b82f6"
            percentage={qualityMetrics.accessibilityScore * 100}
          />
          
          <ChartBar
            label="Semantic Richness"
            value={qualityMetrics.semanticRichness * 100}
            maxValue={100}
            color="#f59e0b"
            percentage={qualityMetrics.semanticRichness * 100}
          />
        </div>

        {/* Performance Breakdown */}
        <div className="chart-card" style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
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
            value={performanceMetrics.scraping.fetchTime}
            maxValue={performanceMetrics.scraping.totalTime}
            color="#ef4444"
          />
          
          <ChartBar
            label="Parse Time"
            value={performanceMetrics.scraping.parseTime || 0}
            maxValue={performanceMetrics.scraping.totalTime}
            color="#f59e0b"
          />
          
          <ChartBar
            label="Analysis Time"
            value={performanceMetrics.scraping.analysisTime}
            maxValue={performanceMetrics.scraping.totalTime}
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
            <strong>Efficiency:</strong> {performanceSummary.efficiency.toFixed(1)} elements/second
          </div>
        </div>

        {/* Content Analysis */}
        <div className="chart-card" style={{
          background: 'white',
          padding: '24px',
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
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
                {(performanceMetrics.content.htmlSize / 1024).toFixed(1)}KB
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
                {performanceMetrics.content.relationshipCount}
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>Total Relationships</div>
            </div>
          </div>

          {/* Recommendations */}
          <div style={{
            marginTop: '20px',
            padding: '16px',
            backgroundColor: '#fef3c7',
            borderRadius: '6px',
            border: '1px solid #fbbf24'
          }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              marginBottom: '8px',
              color: '#92400e'
            }}>
              Top Recommendations:
            </h4>
            <ul style={{ 
              margin: 0, 
              paddingLeft: '16px',
              fontSize: '13px',
              color: '#92400e'
            }}>
              {insights.recommendations.slice(0, 3).map((rec, index) => (
                <li key={index} style={{ marginBottom: '4px' }}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};