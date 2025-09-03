import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PerformanceMonitor, PerformanceAlert, PerformanceThresholds } from './performanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    vi.clearAllMocks();
  });

  describe('Monitoring Operations', () => {
    it('starts scrape monitoring', () => {
      const id = monitor.startScrapeMonitoring('https://test.com');
      
      expect(id).toBeDefined();
      expect(id).toMatch(/^perf_\d+_[a-z0-9]+$/);
    });

    it('updates scrape metrics', () => {
      const id = monitor.startScrapeMonitoring('https://test.com');
      
      monitor.updateScrapeMetrics(id, {
        scraping: { totalTime: 3000 },
        network: { responseTime: 1500 },
        quality: { successRate: 0.95 }
      });
      
      const metrics = monitor.getMetrics(1);
      expect(metrics).toHaveLength(1);
      expect(metrics[0].scraping.totalTime).toBe(3000);
      expect(metrics[0].network.responseTime).toBe(1500);
      expect(metrics[0].quality.successRate).toBe(0.95);
    });

    it('handles non-existent metric ID gracefully', () => {
      expect(() => {
        monitor.updateScrapeMetrics('invalid-id', {
          scraping: { totalTime: 1000 }
        });
      }).not.toThrow();
    });
  });

  describe('Metrics Retrieval', () => {
    it('gets metrics with default limit', () => {
      monitor.startScrapeMonitoring('https://test1.com');
      monitor.startScrapeMonitoring('https://test2.com');
      
      const metrics = monitor.getMetrics();
      expect(metrics.length).toBeLessThanOrEqual(10); // Default limit
    });

    it('gets metrics with custom limit', () => {
      for (let i = 0; i < 15; i++) {
        monitor.startScrapeMonitoring(`https://test${i}.com`);
      }
      
      const metrics = monitor.getMetrics(5);
      expect(metrics).toHaveLength(5);
    });

    it('returns metrics sorted by timestamp descending', () => {
      const id1 = monitor.startScrapeMonitoring('https://test1.com');
      const id2 = monitor.startScrapeMonitoring('https://test2.com');
      
      const metrics = monitor.getMetrics();
      const timestamps = metrics.map(m => new Date(m.timestamp).getTime());
      
      for (let i = 1; i < timestamps.length; i++) {
        expect(timestamps[i - 1]).toBeGreaterThanOrEqual(timestamps[i]);
      }
    });
  });

  describe('Performance Alerts', () => {
    let customThresholds: PerformanceThresholds;

    beforeEach(() => {
      customThresholds = {
        responseTime: 2000,
        totalTime: 5000,
        errorRate: 0.1,
        complexity: 50,
        successRate: 0.8
      };
    });

    it('generates alerts for high response time', () => {
      const id = monitor.startScrapeMonitoring('https://slow.com');
      monitor.updateScrapeMetrics(id, {
        network: { responseTime: 3000 } // Above default threshold
      });
      
      const alerts = monitor.getAlerts('https://slow.com');
      expect(alerts.length).toBeGreaterThan(0);
      
      const responseAlert = alerts.find(a => a.category === 'network');
      expect(responseAlert).toBeDefined();
      expect(responseAlert!.message).toContain('response time');
    });

    it('generates alerts for high total processing time', () => {
      const id = monitor.startScrapeMonitoring('https://complex.com');
      monitor.updateScrapeMetrics(id, {
        scraping: { totalTime: 10000 } // Above default threshold
      });
      
      const alerts = monitor.getAlerts('https://complex.com');
      const processingAlert = alerts.find(a => a.category === 'performance');
      
      expect(processingAlert).toBeDefined();
      expect(processingAlert!.message).toContain('processing time');
    });

    it('generates alerts for low success rate', () => {
      const id = monitor.startScrapeMonitoring('https://unreliable.com');
      monitor.updateScrapeMetrics(id, {
        quality: { successRate: 0.6 } // Below default threshold
      });
      
      const alerts = monitor.getAlerts('https://unreliable.com');
      const qualityAlert = alerts.find(a => a.category === 'quality');
      
      expect(qualityAlert).toBeDefined();
      expect(qualityAlert!.message).toContain('success rate');
    });

    it('generates alerts for high complexity', () => {
      const id = monitor.startScrapeMonitoring('https://heavy.com');
      monitor.updateScrapeMetrics(id, {
        content: { complexity: 75 } // Above default threshold
      });
      
      const alerts = monitor.getAlerts('https://heavy.com');
      const complexityAlert = alerts.find(a => a.category === 'complexity');
      
      expect(complexityAlert).toBeDefined();
      expect(complexityAlert!.message).toContain('complexity');
    });

    it('uses custom thresholds when provided', () => {
      monitor.setThresholds(customThresholds);
      
      const id = monitor.startScrapeMonitoring('https://test.com');
      monitor.updateScrapeMetrics(id, {
        network: { responseTime: 1500 } // Below custom threshold
      });
      
      const alerts = monitor.getAlerts('https://test.com');
      const responseAlert = alerts.find(a => a.category === 'network');
      
      expect(responseAlert).toBeUndefined(); // Should not trigger with custom threshold
    });

    it('filters alerts by URL', () => {
      const id1 = monitor.startScrapeMonitoring('https://test1.com');
      const id2 = monitor.startScrapeMonitoring('https://test2.com');
      
      monitor.updateScrapeMetrics(id1, {
        network: { responseTime: 3000 }
      });
      
      monitor.updateScrapeMetrics(id2, {
        network: { responseTime: 3000 }
      });
      
      const test1Alerts = monitor.getAlerts('https://test1.com');
      const test2Alerts = monitor.getAlerts('https://test2.com');
      
      expect(test1Alerts.length).toBeGreaterThan(0);
      expect(test2Alerts.length).toBeGreaterThan(0);
      
      // Each should only contain alerts for their respective URL
      test1Alerts.forEach(alert => {
        expect(alert.url).toBe('https://test1.com');
      });
    });

    it('limits alert results', () => {
      const id = monitor.startScrapeMonitoring('https://problematic.com');
      
      // Generate multiple alerts
      monitor.updateScrapeMetrics(id, {
        network: { responseTime: 5000 },
        scraping: { totalTime: 15000 },
        quality: { successRate: 0.3 },
        content: { complexity: 100 }
      });
      
      const limitedAlerts = monitor.getAlerts('https://problematic.com', 2);
      expect(limitedAlerts).toHaveLength(2);
    });
  });

  describe('Report Generation', () => {
    beforeEach(() => {
      // Create some test data
      for (let i = 0; i < 5; i++) {
        const id = monitor.startScrapeMonitoring(`https://test${i}.com`);
        monitor.updateScrapeMetrics(id, {
          scraping: { totalTime: 2000 + (i * 500) },
          network: { responseTime: 1000 + (i * 200) },
          quality: { successRate: 0.9 - (i * 0.05) },
          content: { complexity: 20 + (i * 10) }
        });
      }
    });

    it('generates performance report', () => {
      const report = monitor.generateReport(24);
      
      expect(report).toHaveProperty('period');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('alerts');
      expect(report).toHaveProperty('recommendations');
      
      expect(report.summary).toHaveProperty('totalScrapes');
      expect(report.summary).toHaveProperty('averageResponseTime');
      expect(report.summary).toHaveProperty('averageProcessingTime');
      expect(report.summary).toHaveProperty('successRate');
    });

    it('calculates correct summary statistics', () => {
      const report = monitor.generateReport(24);
      
      expect(report.summary.totalScrapes).toBe(5);
      expect(report.summary.averageResponseTime).toBeGreaterThan(0);
      expect(report.summary.successRate).toBeGreaterThan(0);
      expect(report.summary.successRate).toBeLessThanOrEqual(1);
    });

    it('includes alerts in report', () => {
      const report = monitor.generateReport(24);
      
      expect(Array.isArray(report.alerts)).toBe(true);
      if (report.alerts.length > 0) {
        expect(report.alerts[0]).toHaveProperty('type');
        expect(report.alerts[0]).toHaveProperty('message');
      }
    });

    it('provides recommendations', () => {
      const report = monitor.generateReport(24);
      
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(typeof report.recommendations[0]).toBe('string');
    });
  });

  describe('Data Export', () => {
    beforeEach(() => {
      // Create test metrics
      const id1 = monitor.startScrapeMonitoring('https://export-test1.com');
      const id2 = monitor.startScrapeMonitoring('https://export-test2.com');
      
      monitor.updateScrapeMetrics(id1, {
        scraping: { totalTime: 2000 },
        network: { responseTime: 1000 }
      });
      
      monitor.updateScrapeMetrics(id2, {
        scraping: { totalTime: 3000 },
        network: { responseTime: 1500 }
      });
    });

    it('exports to CSV format', () => {
      const metrics = monitor.getMetrics();
      const csv = monitor.exportToCSV(metrics);
      
      expect(csv).toContain('id,url,timestamp'); // Header
      expect(csv).toContain('export-test1.com');
      expect(csv).toContain('export-test2.com');
      expect(csv.split('\n').length).toBeGreaterThan(2); // Header + data rows
    });

    it('exports to JSON format', () => {
      const metrics = monitor.getMetrics();
      const json = monitor.exportToJSON(metrics);
      
      const parsed = JSON.parse(json);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0]).toHaveProperty('url');
      expect(parsed[0]).toHaveProperty('scraping');
    });

    it('handles empty metrics for export', () => {
      const emptyCSV = monitor.exportToCSV([]);
      const emptyJSON = monitor.exportToJSON([]);
      
      expect(emptyCSV).toContain('id,url,timestamp'); // Header only
      expect(JSON.parse(emptyJSON)).toEqual([]);
    });
  });

  describe('Threshold Management', () => {
    it('gets default thresholds', () => {
      const thresholds = monitor.getThresholds();
      
      expect(thresholds).toHaveProperty('responseTime');
      expect(thresholds).toHaveProperty('totalTime');
      expect(thresholds).toHaveProperty('errorRate');
      expect(thresholds).toHaveProperty('complexity');
      expect(thresholds).toHaveProperty('successRate');
      
      expect(thresholds.responseTime).toBeGreaterThan(0);
      expect(thresholds.successRate).toBeGreaterThan(0);
      expect(thresholds.successRate).toBeLessThanOrEqual(1);
    });

    it('updates thresholds', () => {
      const newThresholds: PerformanceThresholds = {
        responseTime: 1500,
        totalTime: 4000,
        errorRate: 0.15,
        complexity: 40,
        successRate: 0.85
      };
      
      monitor.setThresholds(newThresholds);
      const updated = monitor.getThresholds();
      
      expect(updated).toEqual(newThresholds);
    });

    it('validates threshold values', () => {
      const invalidThresholds = {
        responseTime: -1000, // Invalid
        totalTime: 5000,
        errorRate: 1.5, // Invalid (> 1)
        complexity: 50,
        successRate: -0.1 // Invalid
      };
      
      // Should handle invalid values gracefully
      expect(() => {
        monitor.setThresholds(invalidThresholds as any);
      }).not.toThrow();
    });
  });
});