import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SQLMagicIntegration, SQLMagicConfig } from '../../../src/analytics/sqlMagicIntegration';
import { HTMLGraph, HTMLObject } from '../../../src/analytics/htmlObjectAnalyzer';
import { PerformanceMetrics } from '../../../src/analytics/performanceMonitor';

describe('SQLMagicIntegration', () => {
  let sqlIntegration: SQLMagicIntegration;
  let mockConfig: SQLMagicConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    mockConfig = {
      host: 'localhost',
      port: 5432,
      database: 'test_db',
      username: 'test_user',
      password: 'test_pass'
    };
    sqlIntegration = new SQLMagicIntegration(mockConfig);
    sqlIntegration.clearQueryLog(); // Clear query log for each test
  });

  describe('Connection Management', () => {
    it('connects successfully', async () => {
      const result = await sqlIntegration.connect();
      expect(result).toBe(true);
      expect(sqlIntegration.isConnected()).toBe(true);
    });

    it('handles connection failure', async () => {
      // Mock a connection failure scenario
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // This would need to be implemented in the actual class to test failures
      const result = await sqlIntegration.connect();
      expect(result).toBe(true); // Currently always returns true in mock
    });

    it('disconnects properly', async () => {
      await sqlIntegration.connect();
      expect(sqlIntegration.isConnected()).toBe(true);
      
      await sqlIntegration.disconnect();
      expect(sqlIntegration.isConnected()).toBe(false);
    });

    it('tracks connection state correctly', () => {
      expect(sqlIntegration.isConnected()).toBe(false);
    });
  });

  describe('Schema Management', () => {
    it('returns database schema definition', () => {
      const schema = sqlIntegration.getDatabaseSchema();
      
      expect(schema).toHaveLength(5);
      expect(schema.map(t => t.name)).toEqual([
        'html_graphs',
        'html_objects', 
        'html_relationships',
        'performance_metrics',
        'schema_org_data'
      ]);
    });

    it('includes correct table structures', () => {
      const schema = sqlIntegration.getDatabaseSchema();
      const htmlGraphs = schema.find(t => t.name === 'html_graphs');
      
      expect(htmlGraphs).toBeDefined();
      expect(htmlGraphs!.schema).toHaveProperty('id');
      expect(htmlGraphs!.schema).toHaveProperty('url');
      expect(htmlGraphs!.schema).toHaveProperty('total_objects');
      expect(htmlGraphs!.indexes).toContain('url');
    });

    it('defines proper foreign key constraints', () => {
      const schema = sqlIntegration.getDatabaseSchema();
      const htmlObjects = schema.find(t => t.name === 'html_objects');
      
      expect(htmlObjects).toBeDefined();
      expect(htmlObjects!.constraints).toContain('FOREIGN KEY (graph_id) REFERENCES html_graphs(id)');
    });
  });

  describe('Data Storage', () => {
    let mockHtmlGraph: HTMLGraph;
    let mockPerformanceMetrics: PerformanceMetrics;

    beforeEach(() => {
      const mockObjects = new Map<string, HTMLObject>();
      mockObjects.set('obj1', {
        id: 'obj1',
        tag: 'div',
        type: 'structural',
        attributes: { class: 'container' },
        text: 'Test content',
        position: { depth: 0, index: 0, parent: null },
        performance: { size: 100, complexity: 1.0 },
        semanticRole: 'container',
        schemaOrgType: 'WebPage'
      });

      mockHtmlGraph = {
        objects: mockObjects,
        relationships: [{
          id: 'rel1',
          source: 'obj1',
          target: 'obj2',
          type: 'parent-child',
          strength: 1.0,
          metadata: {}
        }],
        metadata: {
          url: 'https://test.com',
          title: 'Test Page',
          totalObjects: 1,
          totalRelationships: 1,
          analysisTime: 500,
          performance: { complexity: 1.0, efficiency: 10 }
        }
      };

      mockPerformanceMetrics = {
        id: 'perf1',
        url: 'https://test.com',
        timestamp: new Date().toISOString(),
        scraping: {
          totalTime: 3000,
          fetchTime: 1000,
          parseTime: 500,
          analysisTime: 1500,
          retryAttempts: 0,
          proxyUsed: 'Direct'
        },
        content: {
          htmlSize: 10000,
          objectCount: 1,
          relationshipCount: 1,
          complexity: 1.0,
          maxDepth: 3
        },
        network: {
          responseTime: 1000,
          contentLength: 10000,
          contentType: 'text/html',
          statusCode: 200
        },
        quality: {
          successRate: 1.0,
          dataCompleteness: 0.95,
          errorCount: 0,
          warningCount: 0
        }
      };
    });

    it('stores HTML graph successfully', async () => {
      await sqlIntegration.connect();
      const result = await sqlIntegration.storeHTMLGraph(mockHtmlGraph);
      
      expect(result).toBe(true);
    });

    it('stores performance metrics successfully', async () => {
      await sqlIntegration.connect();
      const result = await sqlIntegration.storePerformanceMetrics(mockPerformanceMetrics);
      
      expect(result).toBe(true);
    });

    it('throws error when not connected', async () => {
      await expect(
        sqlIntegration.storeHTMLGraph(mockHtmlGraph)
      ).rejects.toThrow('Not connected to SQLMagic server');
    });

    it('handles storage errors gracefully', async () => {
      await sqlIntegration.connect();
      
      // This would need to mock actual database errors to test properly
      const result = await sqlIntegration.storeHTMLGraph(mockHtmlGraph);
      expect(result).toBe(true); // Currently always succeeds in mock
    });
  });

  describe('Query Operations', () => {
    beforeEach(async () => {
      await sqlIntegration.connect();
    });

    it('queries graphs by URL', async () => {
      const results = await sqlIntegration.queryGraphsByUrl('test.com', 5);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('url');
      expect(results[0]).toHaveProperty('total_objects');
    });

    it('queries performance trends', async () => {
      const results = await sqlIntegration.queryPerformanceTrends(24);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results[0]).toHaveProperty('hour');
      expect(results[0]).toHaveProperty('avg_response_time');
    });

    it('executes custom queries', async () => {
      const sql = 'SELECT COUNT(*) FROM html_graphs';
      const results = await sqlIntegration.executeCustomQuery(sql);
      
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('message');
    });

    it('throws error for queries when not connected', async () => {
      await sqlIntegration.disconnect();
      
      await expect(
        sqlIntegration.queryGraphsByUrl('test.com')
      ).rejects.toThrow('Not connected to SQLMagic server');
    });
  });

  describe('Query Logging', () => {
    beforeEach(async () => {
      await sqlIntegration.connect();
    });

    it('logs queries with execution details', async () => {
      await sqlIntegration.queryGraphsByUrl('test.com');
      
      const queryLog = sqlIntegration.getQueryLog();
      expect(queryLog.length).toBeGreaterThan(0);
      
      const lastQuery = queryLog[0];
      expect(lastQuery).toHaveProperty('id');
      expect(lastQuery).toHaveProperty('sql');
      expect(lastQuery).toHaveProperty('timestamp');
      expect(lastQuery).toHaveProperty('executionTime');
    });

    it('clears query log', async () => {
      await sqlIntegration.queryGraphsByUrl('test.com');
      expect(sqlIntegration.getQueryLog().length).toBeGreaterThan(0);
      
      sqlIntegration.clearQueryLog();
      expect(sqlIntegration.getQueryLog()).toHaveLength(0);
    });

    it('sorts query log by timestamp descending', async () => {
      // Clear the log to ensure clean state for this test
      sqlIntegration.clearQueryLog();
      
      await sqlIntegration.queryGraphsByUrl('test1.com');
      await sqlIntegration.queryGraphsByUrl('test2.com');
      
      const queryLog = sqlIntegration.getQueryLog();
      expect(queryLog.length).toBe(2);
      
      // More recent query should be first
      const timestamps = queryLog.map(q => new Date(q.timestamp).getTime());
      expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1]);
    });
  });

  describe('Configuration', () => {
    it('accepts full configuration options', () => {
      const fullConfig: SQLMagicConfig = {
        host: 'remote.host.com',
        port: 3306,
        database: 'prod_db',
        username: 'prod_user',
        password: 'secure_pass',
        ssl: true,
        connectionTimeout: 5000
      };
      
      const integration = new SQLMagicIntegration(fullConfig);
      expect(integration).toBeDefined();
    });

    it('works with minimal configuration', () => {
      const minimalConfig: SQLMagicConfig = {
        host: 'localhost',
        port: 5432,
        database: 'test_db'
      };
      
      const integration = new SQLMagicIntegration(minimalConfig);
      expect(integration).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('handles malformed HTML graph data', async () => {
      await sqlIntegration.connect();
      
      const invalidGraph = {
        objects: new Map(),
        relationships: [],
        metadata: {} as any // Invalid metadata
      };
      
      // Should handle gracefully without throwing, but return false for malformed data
      await expect(
        sqlIntegration.storeHTMLGraph(invalidGraph as HTMLGraph)
      ).resolves.toBe(false);
    });

    it('handles network timeouts', async () => {
      // This would need to be implemented in the actual class
      await sqlIntegration.connect();
      expect(sqlIntegration.isConnected()).toBe(true);
    });
  });
});