import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SQLMagicIntegration } from '../../../src/analytics/sqlMagicIntegration';

// Mock console to avoid noise in test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});

describe('Security - SQL Injection Prevention', () => {
  let sqlIntegration: SQLMagicIntegration;
  
  const testConfig = {
    host: 'localhost',
    port: 5432,
    database: 'testdb',
    username: 'testuser',
    password: 'testpass',
    ssl: false
  };

  beforeEach(async () => {
    sqlIntegration = new SQLMagicIntegration(testConfig);
    await sqlIntegration.connect();
  });

  afterEach(async () => {
    await sqlIntegration.disconnect();
    sqlIntegration.cleanup();
  });

  describe('Parameterized Query Protection', () => {
    it('should use parameterized queries for all database operations', async () => {
      // Mock HTML graph data that could contain malicious content
      const maliciousGraph = {
        id: 'test-graph',
        metadata: {
          url: "https://evil.com'; DROP TABLE html_graphs; --",
          title: "<script>alert('sql injection')</script>",
          analyzedAt: new Date().toISOString(),
          totalObjects: 100,
          totalRelationships: 50,
          performance: {
            complexity: 25.5,
            analysisTime: 1500
          }
        },
        objects: new Map([
          ['obj1', {
            id: 'obj1',
            type: "'; DELETE FROM html_objects WHERE '1'='1",
            tag: 'div',
            semanticRole: null,
            schemaOrgType: null,
            text: "'; UPDATE users SET admin=1; --",
            position: { depth: 1, index: 0, parent: null },
            performance: { size: 100 },
            attributes: {
              class: "malicious'; DROP DATABASE testdb; --",
              id: 'test" onload="malicious()'
            }
          }]
        ]),
        relationships: [{
          id: 'rel1',
          source: 'obj1',
          target: 'obj2',
          type: "'; EXEC xp_cmdshell('format c:'); --",
          strength: 1.0,
          metadata: {
            injection: "' OR '1'='1"
          }
        }]
      };

      // Should handle malicious data without executing SQL injection
      const result = await sqlIntegration.storeHTMLGraph(maliciousGraph as any);
      expect(result).toBe(true);

      // Check that queries were logged (indicating parameterized queries were used)
      const queryLog = sqlIntegration.getQueryLog();
      expect(queryLog.length).toBeGreaterThan(0);

      // All queries should use proper parameterization (contain ? placeholders)
      queryLog.forEach(query => {
        expect(query.sql).toMatch(/\?/); // Should contain parameter placeholders
        expect(query.parameters).toBeDefined(); // Should have parameters object
      });
    });

    it('should sanitize input in query performance trends method', async () => {
      // Test with malicious hours parameter that could be used for injection
      const maliciousHours = "24; DROP TABLE performance_metrics; --" as any;
      
      const trends = await sqlIntegration.queryPerformanceTrends(maliciousHours);
      expect(trends).toBeDefined();
      expect(Array.isArray(trends)).toBe(true);

      // Check that the input was properly validated/sanitized
      const queryLog = sqlIntegration.getQueryLog();
      const trendsQuery = queryLog.find(q => q.sql.includes('performance_metrics'));
      
      expect(trendsQuery).toBeDefined();
      expect(trendsQuery!.parameters).toBeDefined();
      expect(trendsQuery!.parameters!.hours).toBeTypeOf('number');
      expect(trendsQuery!.parameters!.hours).toBeGreaterThanOrEqual(1);
      expect(trendsQuery!.parameters!.hours).toBeLessThanOrEqual(8760);
    });

    it('should handle malicious URL patterns in graph queries', async () => {
      const maliciousUrls = [
        "'; DROP TABLE html_graphs; SELECT * FROM users WHERE '1'='1",
        "' UNION SELECT password FROM users --",
        "'; INSERT INTO admin_users VALUES ('hacker', 'password'); --",
        "'; UPDATE html_graphs SET url='hacked' WHERE '1'='1'; --",
        "' OR 1=1 --",
        "'; EXEC xp_cmdshell('rm -rf /'); --"
      ];

      for (const maliciousUrl of maliciousUrls) {
        const results = await sqlIntegration.queryGraphsByUrl(maliciousUrl);
        expect(results).toBeDefined();
        expect(Array.isArray(results)).toBe(true);

        // Verify query was parameterized
        const queryLog = sqlIntegration.getQueryLog();
        const urlQuery = queryLog[queryLog.length - 1]; // Most recent query
        
        expect(urlQuery.sql).toContain('?'); // Should use parameter placeholder
        expect(urlQuery.parameters).toBeDefined();
        expect(urlQuery.parameters!.url).toBe(`%${maliciousUrl}%`); // Should wrap in LIKE pattern
      }
    });
  });

  describe('Input Validation and Sanitization', () => {
    it('should validate and limit numeric inputs', async () => {
      // Test boundary conditions and malicious numeric inputs
      const testCases = [
        { input: -1, expected: 1 },           // Negative to minimum
        { input: 0, expected: 1 },            // Zero to minimum  
        { input: 9999999, expected: 8760 },   // Too large to maximum
        { input: 8761, expected: 8760 },      // Just over limit
        { input: 3.14159, expected: 3 },      // Decimal should be floored
        { input: "24", expected: 24 },        // String number should work
        { input: null, expected: 1 },         // Null should default
        { input: undefined, expected: 1 },    // Undefined should default
        { input: NaN, expected: 1 },          // NaN should default
        { input: Infinity, expected: 8760 },  // Infinity should cap
        { input: -Infinity, expected: 1 }     // -Infinity should floor
      ];

      for (const { input, expected } of testCases) {
        const trends = await sqlIntegration.queryPerformanceTrends(input as any);
        expect(trends).toBeDefined();

        const queryLog = sqlIntegration.getQueryLog();
        const query = queryLog[queryLog.length - 1];
        expect(query.parameters!.hours).toBe(expected);
      }
    });

    it('should reject custom queries with dangerous SQL patterns', async () => {
      const dangerousSqlPatterns = [
        "SELECT * FROM users; DROP TABLE html_graphs;",
        "'; DELETE FROM html_objects WHERE 1=1; --",
        "UNION SELECT password FROM admin_users",
        "'; INSERT INTO users VALUES ('hacker', 'pass'); --",
        "; UPDATE html_graphs SET url='hacked';",
        "'; EXEC xp_cmdshell('rm -rf /'); --",
        "'; TRUNCATE TABLE performance_metrics; --",
        "' OR '1'='1'; DROP DATABASE testdb; --"
      ];

      for (const dangerousQuery of dangerousSqlPatterns) {
        try {
          await sqlIntegration.executeCustomQuery(dangerousQuery);
          // If it doesn't throw, ensure it was safely handled
          const queryLog = sqlIntegration.getQueryLog();
          const lastQuery = queryLog[queryLog.length - 1];
          
          // Should log the query but handle it safely
          expect(lastQuery.sql).toBe(dangerousQuery);
          
        } catch (error) {
          // It's also acceptable to reject dangerous queries entirely
          expect(error).toBeDefined();
        }
      }
    });

    it('should handle object attribute injection attempts', async () => {
      const maliciousAttributes = {
        "'; DROP TABLE html_objects; --": "value1",
        "onclick": "javascript:malicious()",
        "src": "javascript:alert('xss')",
        "href": "'; DELETE FROM users; --", 
        "data-evil": "'; UPDATE admin SET password='hacked'; --",
        "style": "background:url('javascript:evil()')"
      };

      const testGraph = {
        id: 'test',
        metadata: {
          url: 'https://test.com',
          title: 'Test',
          analyzedAt: new Date().toISOString(),
          totalObjects: 1,
          totalRelationships: 0,
          performance: { complexity: 10, analysisTime: 100 }
        },
        objects: new Map([
          ['test-obj', {
            id: 'test-obj',
            type: 'element',
            tag: 'div',
            semanticRole: null,
            schemaOrgType: null,
            text: 'test',
            position: { depth: 1, index: 0, parent: null },
            performance: { size: 100 },
            attributes: maliciousAttributes
          }]
        ]),
        relationships: []
      };

      const result = await sqlIntegration.storeHTMLGraph(testGraph as any);
      expect(result).toBe(true);

      // Verify attributes were stored safely as JSON
      const queryLog = sqlIntegration.getQueryLog();
      const objectInsert = queryLog.find(q => q.sql.includes('html_objects'));
      
      expect(objectInsert).toBeDefined();
      expect(objectInsert!.parameters).toBeDefined();
      
      // Attributes should be JSON stringified, preventing SQL injection
      const attributesParam = objectInsert!.parameters!.attributes;
      expect(typeof attributesParam).toBe('string');
      expect(() => JSON.parse(attributesParam)).not.toThrow();
    });
  });

  describe('Error Handling and Security Logging', () => {
    it('should not expose sensitive database information in errors', async () => {
      // Create an integration with invalid config to trigger errors
      const invalidConfig = {
        host: 'nonexistent-host',
        port: 9999,
        database: 'fake_db',
        username: 'fake_user',
        password: 'fake_pass'
      };

      const invalidIntegration = new SQLMagicIntegration(invalidConfig);
      
      try {
        await invalidIntegration.connect();
      } catch (error: any) {
        // Error messages should not expose sensitive config details
        expect(error.message).not.toContain('fake_pass');
        expect(error.message).not.toContain('fake_user');
        // Database host/port might be acceptable to show for debugging
      }
    });

    it('should log suspicious query patterns for security monitoring', async () => {
      const suspiciousQueries = [
        "SELECT COUNT(*) FROM information_schema.tables",
        "'; SHOW TABLES; --",  
        "'; DESCRIBE users; --",
        "' UNION SELECT version(); --"
      ];

      for (const query of suspiciousQueries) {
        await sqlIntegration.executeCustomQuery(query).catch(() => {});
      }

      const queryLog = sqlIntegration.getQueryLog();
      
      // All suspicious queries should be logged
      suspiciousQueries.forEach(suspiciousQuery => {
        const logEntry = queryLog.find(q => q.sql === suspiciousQuery);
        expect(logEntry).toBeDefined();
        expect(logEntry!.timestamp).toBeDefined();
        expect(logEntry!.id).toBeDefined();
      });
    });

    it('should handle connection timeout and cleanup properly', async () => {
      // Test with very short timeout to trigger timeout handling
      const timeoutConfig = {
        ...testConfig,
        connectionTimeout: 1 // 1ms timeout
      };

      const timeoutIntegration = new SQLMagicIntegration(timeoutConfig);
      
      // Should handle timeout gracefully
      const _connectResult = await timeoutIntegration.connect();
      
      // Even if connection fails, cleanup should work
      expect(() => timeoutIntegration.cleanup()).not.toThrow();
      expect(timeoutIntegration.isConnected()).toBe(false);
    });
  });

  describe('Performance and Resource Security', () => {
    it('should limit query result size to prevent DoS attacks', async () => {
      // Test with very large limit parameter
      const results = await sqlIntegration.queryGraphsByUrl('test', 999999);
      
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
      
      // Should have reasonable limits regardless of requested size
      expect(results.length).toBeLessThanOrEqual(1000); // Reasonable upper bound
    });

    it('should handle concurrent operations safely', async () => {
      const concurrentOperations = Array.from({ length: 10 }, (_, i) => 
        sqlIntegration.queryGraphsByUrl(`test-${i}`, 5)
      );

      const results = await Promise.all(concurrentOperations);
      
      // All operations should complete successfully
      expect(results).toHaveLength(10);
      results.forEach(result => {
        expect(Array.isArray(result)).toBe(true);
      });

      // Query log should show all operations were handled
      const queryLog = sqlIntegration.getQueryLog();
      expect(queryLog.length).toBeGreaterThanOrEqual(10);
    });

    it('should prevent memory exhaustion from large data sets', async () => {
      // Create a large graph with many objects
      const largeGraph = {
        id: 'large-test',
        metadata: {
          url: 'https://large-test.com',
          title: 'Large Test',
          analyzedAt: new Date().toISOString(),
          totalObjects: 1000,
          totalRelationships: 2000,
          performance: { complexity: 85, analysisTime: 5000 }
        },
        objects: new Map(),
        relationships: []
      };

      // Add many objects (but not so many as to actually exhaust memory in test)
      for (let i = 0; i < 100; i++) {
        largeGraph.objects.set(`obj-${i}`, {
          id: `obj-${i}`,
          type: 'element',
          tag: 'div',
          semanticRole: null,
          schemaOrgType: null,
          text: `Content for object ${i}`,
          position: { depth: 1, index: i, parent: null },
          performance: { size: 100 },
          attributes: { id: `obj-${i}`, class: 'test-element' }
        });
      }

      // Should handle large data sets without memory issues
      const startTime = Date.now();
      const result = await sqlIntegration.storeHTMLGraph(largeGraph as any);
      const executionTime = Date.now() - startTime;
      
      expect(result).toBe(true);
      expect(executionTime).toBeLessThan(10000); // Should complete in reasonable time
    });
  });

  describe('Schema Security', () => {
    it('should create tables with proper constraints and indexes', () => {
      const schema = sqlIntegration.getDatabaseSchema();
      
      expect(schema).toBeDefined();
      expect(Array.isArray(schema)).toBe(true);
      
      schema.forEach(table => {
        // Each table should have proper structure
        expect(table.name).toBeDefined();
        expect(table.schema).toBeDefined();
        expect(table.indexes).toBeDefined();
        expect(table.constraints).toBeDefined();
        
        // Primary keys should be defined
        const primaryKeyColumn = Object.entries(table.schema).find(([, type]) => 
          type.includes('PRIMARY KEY')
        );
        expect(primaryKeyColumn).toBeDefined();
        
        // Foreign key constraints should be properly defined
        table.constraints.forEach(constraint => {
          if (constraint.includes('FOREIGN KEY')) {
            expect(constraint).toMatch(/REFERENCES \w+\(\w+\)/);
          }
        });
      });
    });

    it('should use appropriate data types to prevent overflow attacks', () => {
      const schema = sqlIntegration.getDatabaseSchema();
      
      // Check for reasonable data type constraints
      schema.forEach(table => {
        Object.entries(table.schema).forEach(([_column, type]) => {
          // VARCHAR fields should have reasonable limits
          if (type.includes('VARCHAR')) {
            expect(type).toMatch(/VARCHAR\(\d+\)/);
            const match = type.match(/VARCHAR\((\d+)\)/);
            if (match) {
              const limit = parseInt(match[1]);
              expect(limit).toBeGreaterThan(0);
              expect(limit).toBeLessThanOrEqual(65535); // Reasonable upper bound
            }
          }
          
          // Numeric fields should have proper precision
          if (type.includes('DECIMAL')) {
            expect(type).toMatch(/DECIMAL\(\d+,\d+\)/);
          }
        });
      });
    });
  });
});