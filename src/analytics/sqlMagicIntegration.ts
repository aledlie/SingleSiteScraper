import { HTMLGraph, HTMLObject, HTMLRelationship } from './htmlObjectAnalyzer';
import { PerformanceMetrics } from './performanceMonitor';

export interface SQLMagicConfig {
  host: string;
  port: number;
  database: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionTimeout?: number;
}

export interface SQLMagicQuery {
  id: string;
  sql: string;
  parameters?: Record<string, any>;
  timestamp: string;
  executionTime?: number;
  resultCount?: number;
}

export interface SQLMagicTable {
  name: string;
  schema: Record<string, string>;
  indexes: string[];
  constraints: string[];
}

export class SQLMagicIntegration {
  private config: SQLMagicConfig;
  private connected: boolean = false;
  private queryLog: SQLMagicQuery[] = [];
  private timeouts: Set<NodeJS.Timeout> = new Set();
  private abortController: AbortController = new AbortController();

  constructor(config: SQLMagicConfig) {
    this.config = config;
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.abortController.signal.aborted) {
        reject(new Error('Operation aborted'));
        return;
      }
      
      const timeout = setTimeout(resolve, ms);
      this.timeouts.add(timeout);
      
      this.abortController.signal.addEventListener('abort', () => {
        clearTimeout(timeout);
        this.timeouts.delete(timeout);
        reject(new Error('Operation aborted'));
      });
      
      // Clean up timeout when promise resolves
      if (timeout.unref) timeout.unref();
    });
  }


  private generateQueryId(): string {
    return `sql_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logQuery(sql: string, parameters?: Record<string, any>): string {
    const queryId = this.generateQueryId();
    this.queryLog.push({
      id: queryId,
      sql,
      parameters: parameters ?? {},  // Always provide parameters object (empty if not specified)
      timestamp: new Date().toISOString()
    });
    return queryId;
  }

  private updateQueryLog(queryId: string, executionTime: number, resultCount: number): void {
    const query = this.queryLog.find(q => q.id === queryId);
    if (query) {
      query.executionTime = executionTime;
      query.resultCount = resultCount;
    }
  }

  async connect(): Promise<boolean> {
    try {
      // Simulate connection to SQLMagic server
      // In a real implementation, this would establish the actual connection
      console.log(`Connecting to SQLMagic server at ${this.config.host}:${this.config.port}`);

      // Mock connection delay
      await this.delay(1000);

      this.connected = true;
      console.log('Connected to SQLMagic server');

      // Initialize database schema
      await this.initializeSchema();

      // Clear query log after schema initialization so users only see their queries
      this.clearQueryLog();

      return true;
    } catch (error) {
      console.error('Failed to connect to SQLMagic server:', error);
      this.connected = false;
      return false;
    }
  }

  private async initializeSchema(): Promise<void> {
    if (!this.connected) throw new Error('Not connected to SQLMagic server');

    const tables: SQLMagicTable[] = [
      {
        name: 'html_graphs',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          url: 'TEXT NOT NULL',
          title: 'TEXT',
          analyzed_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
          total_objects: 'INTEGER',
          total_relationships: 'INTEGER',
          complexity: 'DECIMAL(10,2)',
          analysis_time: 'INTEGER',
          metadata: 'JSON'
        },
        indexes: ['url', 'analyzed_at', 'complexity'],
        constraints: []
      },
      {
        name: 'html_objects',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          graph_id: 'VARCHAR(255) NOT NULL',
          object_type: 'VARCHAR(100)',
          tag: 'VARCHAR(50)',
          semantic_role: 'VARCHAR(100)',
          schema_org_type: 'VARCHAR(100)',
          text_content: 'TEXT',
          depth: 'INTEGER',
          position_index: 'INTEGER',
          parent_id: 'VARCHAR(255)',
          size: 'INTEGER',
          attributes: 'JSON',
          created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        },
        indexes: ['graph_id', 'object_type', 'semantic_role', 'tag', 'parent_id'],
        constraints: ['FOREIGN KEY (graph_id) REFERENCES html_graphs(id)']
      },
      {
        name: 'html_relationships',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          graph_id: 'VARCHAR(255) NOT NULL',
          source_id: 'VARCHAR(255) NOT NULL',
          target_id: 'VARCHAR(255) NOT NULL',
          relationship_type: 'VARCHAR(50)',
          strength: 'DECIMAL(3,2)',
          metadata: 'JSON',
          created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        },
        indexes: ['graph_id', 'source_id', 'target_id', 'relationship_type'],
        constraints: [
          'FOREIGN KEY (graph_id) REFERENCES html_graphs(id)',
          'FOREIGN KEY (source_id) REFERENCES html_objects(id)',
          'FOREIGN KEY (target_id) REFERENCES html_objects(id)'
        ]
      },
      {
        name: 'performance_metrics',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          url: 'TEXT NOT NULL',
          timestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
          total_time: 'INTEGER',
          fetch_time: 'INTEGER',
          parse_time: 'INTEGER',
          analysis_time: 'INTEGER',
          retry_attempts: 'INTEGER',
          proxy_used: 'VARCHAR(100)',
          html_size: 'BIGINT',
          object_count: 'INTEGER',
          relationship_count: 'INTEGER',
          complexity: 'DECIMAL(10,2)',
          max_depth: 'INTEGER',
          response_time: 'INTEGER',
          content_length: 'BIGINT',
          content_type: 'VARCHAR(100)',
          status_code: 'INTEGER',
          success_rate: 'DECIMAL(3,2)',
          data_completeness: 'DECIMAL(3,2)',
          error_count: 'INTEGER',
          warning_count: 'INTEGER'
        },
        indexes: ['url', 'timestamp', 'complexity', 'success_rate'],
        constraints: []
      },
      {
        name: 'schema_org_data',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          graph_id: 'VARCHAR(255) NOT NULL',
          schema_type: 'VARCHAR(100)',
          data: 'JSON',
          created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        },
        indexes: ['graph_id', 'schema_type'],
        constraints: ['FOREIGN KEY (graph_id) REFERENCES html_graphs(id)']
      }
    ];

    for (const table of tables) {
      await this.createTable(table);
    }
  }

  private async createTable(table: SQLMagicTable): Promise<void> {
    const columns = Object.entries(table.schema)
      .map(([name, type]) => `${name} ${type}`)
      .join(',\n  ');

    const constraints = table.constraints.length > 0 
      ? ',\n  ' + table.constraints.join(',\n  ')
      : '';

    const sql = `
CREATE TABLE IF NOT EXISTS ${table.name} (
  ${columns}${constraints}
)`;

    const queryId = this.logQuery(sql);
    const startTime = Date.now();
    
    try {
      // Mock table creation
      console.log(`Creating table: ${table.name}`);
      await this.delay(100);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, 0);

      // Create indexes
      for (const index of table.indexes) {
        await this.createIndex(table.name, index);
      }
      
    } catch (error) {
      console.error(`Failed to create table ${table.name}:`, error);
      throw error;
    }
  }

  private async createIndex(tableName: string, columnName: string): Promise<void> {
    const indexName = `idx_${tableName}_${columnName.replace(/[(),\s]/g, '_')}`;
    const sql = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${columnName})`;
    
    const queryId = this.logQuery(sql);
    const startTime = Date.now();
    
    try {
      // Mock index creation
      await this.delay(50);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, 0);
      
    } catch (error) {
      console.error(`Failed to create index ${indexName}:`, error);
    }
  }

  async storeHTMLGraph(graph: HTMLGraph): Promise<boolean> {
    if (!this.connected) throw new Error('Not connected to SQLMagic server');

    try {
      // Store graph metadata
      const graphId = await this.insertGraph(graph);
      
      // Store objects
      await this.insertObjects(graphId, graph.objects);
      
      // Store relationships
      await this.insertRelationships(graphId, graph.relationships);
      
      // Store schema.org data if available
      await this.insertSchemaOrgData(graphId, graph);
      
      return true;
    } catch (error) {
      console.error('Failed to store HTML graph:', error);
      return false;
    }
  }

  private async insertGraph(graph: HTMLGraph): Promise<string> {
    const sql = `
INSERT INTO html_graphs (
  id, url, title, analyzed_at, total_objects, total_relationships, 
  complexity, analysis_time, metadata
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const graphId = `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const parameters = {
      id: graphId,
      url: graph.metadata.url,
      title: graph.metadata.title,
      analyzed_at: graph.metadata.analyzedAt,
      total_objects: graph.metadata.totalObjects,
      total_relationships: graph.metadata.totalRelationships,
      complexity: graph.metadata.performance.complexity,
      analysis_time: graph.metadata.performance.analysisTime,
      metadata: JSON.stringify(graph.metadata)
    };

    const queryId = this.logQuery(sql, parameters);
    const startTime = Date.now();
    
    try {
      // Mock insert
      await this.delay(100);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, 1);
      
      return graphId;
    } catch (error) {
      console.error('Failed to insert graph:', error);
      throw error;
    }
  }

  private async insertObjects(graphId: string, objects: Map<string, HTMLObject>): Promise<void> {
    const sql = `
INSERT INTO html_objects (
  id, graph_id, object_type, tag, semantic_role, schema_org_type,
  text_content, depth, position_index, parent_id, size, attributes
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const startTime = Date.now();

    try {
      let insertCount = 0;

      for (const [objectId, obj] of objects) {
        // Parameters prepared for SQL insert
        const objectParams = {
          id: objectId,
          graph_id: graphId,
          object_type: obj.type,
          tag: obj.tag,
          semantic_role: obj.semanticRole || null,
          schema_org_type: obj.schemaOrgType || null,
          text_content: obj.text || null,
          depth: obj.position.depth,
          position_index: obj.position.index,
          parent_id: obj.position.parent || null,
          size: obj.performance.size,
          attributes: JSON.stringify(obj.attributes)
        };

        // Log each insert with its parameters (including attributes at top level for security tests)
        this.logQuery(sql, objectParams);

        // Mock insert
        await this.delay(10);
        insertCount++;
      }

      const executionTime = Date.now() - startTime;

      // Update the last query's execution time
      const queryLog = this.queryLog;
      if (queryLog.length > 0) {
        const lastQuery = queryLog[queryLog.length - 1];
        lastQuery.executionTime = executionTime;
        lastQuery.resultCount = insertCount;
      }

    } catch (error) {
      console.error('Failed to insert objects:', error);
      throw error;
    }
  }

  private async insertRelationships(graphId: string, relationships: HTMLRelationship[]): Promise<void> {
    const sql = `
INSERT INTO html_relationships (
  id, graph_id, source_id, target_id, relationship_type, strength, metadata
) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const queryId = this.logQuery(sql);
    const startTime = Date.now();
    
    try {
      let insertCount = 0;
      
      for (const rel of relationships) {
        // Parameters prepared for SQL insert (used in mock insert)
        void {
          id: rel.id,
          graph_id: graphId,
          source_id: rel.source,
          target_id: rel.target,
          relationship_type: rel.type,
          strength: rel.strength,
          metadata: JSON.stringify(rel.metadata)
        };

        // Mock insert
        await this.delay(5);
        insertCount++;
      }
      
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, insertCount);
      
    } catch (error) {
      console.error('Failed to insert relationships:', error);
      throw error;
    }
  }

  private async insertSchemaOrgData(graphId: string, graph: HTMLGraph): Promise<void> {
    // Extract schema.org data from objects
    const schemaObjects = Array.from(graph.objects.values())
      .filter(obj => obj.schemaOrgType);
    
    if (schemaObjects.length === 0) return;

    const sql = `
INSERT INTO schema_org_data (id, graph_id, schema_type, data) VALUES (?, ?, ?, ?)`;

    const queryId = this.logQuery(sql);
    const startTime = Date.now();
    
    try {
      let insertCount = 0;
      
      for (const obj of schemaObjects) {
        const schemaId = `schema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Parameters prepared for SQL insert (used in mock insert)
        void {
          id: schemaId,
          graph_id: graphId,
          schema_type: obj.schemaOrgType,
          data: JSON.stringify({
            objectId: obj.id,
            type: obj.schemaOrgType,
            text: obj.text,
            attributes: obj.attributes,
            semanticRole: obj.semanticRole
          })
        };

        // Mock insert
        await this.delay(10);
        insertCount++;
      }
      
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, insertCount);
      
    } catch (error) {
      console.error('Failed to insert schema.org data:', error);
      throw error;
    }
  }

  async storePerformanceMetrics(metrics: PerformanceMetrics): Promise<boolean> {
    if (!this.connected) throw new Error('Not connected to SQLMagic server');

    const sql = `
INSERT INTO performance_metrics (
  id, url, timestamp, total_time, fetch_time, parse_time, analysis_time,
  retry_attempts, proxy_used, html_size, object_count, relationship_count,
  complexity, max_depth, response_time, content_length, content_type,
  status_code, success_rate, data_completeness, error_count, warning_count
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const parameters = {
      id: metrics.id,
      url: metrics.url,
      timestamp: metrics.timestamp,
      total_time: metrics.scraping.totalTime,
      fetch_time: metrics.scraping.fetchTime,
      parse_time: metrics.scraping.parseTime,
      analysis_time: metrics.scraping.analysisTime,
      retry_attempts: metrics.scraping.retryAttempts,
      proxy_used: metrics.scraping.proxyUsed,
      html_size: metrics.content.htmlSize,
      object_count: metrics.content.objectCount,
      relationship_count: metrics.content.relationshipCount,
      complexity: metrics.content.complexity,
      max_depth: metrics.content.maxDepth,
      response_time: metrics.network.responseTime,
      content_length: metrics.network.contentLength,
      content_type: metrics.network.contentType,
      status_code: metrics.network.statusCode || null,
      success_rate: metrics.quality.successRate,
      data_completeness: metrics.quality.dataCompleteness,
      error_count: metrics.quality.errorCount,
      warning_count: metrics.quality.warningCount
    };

    const queryId = this.logQuery(sql, parameters);
    const startTime = Date.now();
    
    try {
      // Mock insert
      await this.delay(50);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, 1);
      
      return true;
    } catch (error) {
      console.error('Failed to store performance metrics:', error);
      return false;
    }
  }

  async queryGraphsByUrl(url: string, limit: number = 10): Promise<any[]> {
    if (!this.connected) throw new Error('Not connected to SQLMagic server');

    const sql = `
SELECT * FROM html_graphs 
WHERE url LIKE ? 
ORDER BY analyzed_at DESC 
LIMIT ?`;

    const parameters = { url: `%${url}%`, limit };
    const queryId = this.logQuery(sql, parameters);
    const startTime = Date.now();
    
    try {
      // Mock query result
      const mockResults = [
        {
          id: 'graph_123',
          url: url,
          title: 'Mock Page Title',
          analyzed_at: new Date().toISOString(),
          total_objects: 150,
          total_relationships: 300,
          complexity: 45.67,
          analysis_time: 1500
        }
      ];
      
      await this.delay(100);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, mockResults.length);
      
      return mockResults;
    } catch (error) {
      console.error('Failed to query graphs:', error);
      throw error;
    }
  }

  async queryPerformanceTrends(hours?: number | string | null): Promise<any[]> {
    if (!this.connected) throw new Error('Not connected to SQLMagic server');

    // Enhanced input validation and sanitization
    // Handle non-number inputs gracefully by defaulting to minimum
    let numericHours: number;

    // Check for null/undefined first before type checking
    if (hours === null || hours === undefined) {
      numericHours = 1; // Default to minimum for null/undefined
    } else if (typeof hours === 'string') {
      numericHours = parseFloat(hours);
    } else if (typeof hours === 'number') {
      numericHours = hours;
    } else {
      numericHours = NaN;
    }

    // Handle special cases:
    // - Infinity should cap at max (8760)
    // - -Infinity should floor at min (1)
    // - NaN should default to 1
    if (numericHours === Infinity) {
      numericHours = 8760;
    } else if (numericHours === -Infinity || !Number.isFinite(numericHours)) {
      numericHours = 1;
    }

    const validatedHours = Math.max(1, Math.min(8760, Math.floor(Math.abs(numericHours)))); // Limit to 1-8760 hours (1 year)

    // Use parameterized queries to prevent SQL injection
    const sql = `
SELECT 
  DATE_TRUNC('hour', timestamp) as hour,
  AVG(response_time) as avg_response_time,
  AVG(complexity) as avg_complexity,
  AVG(success_rate) as avg_success_rate,
  COUNT(*) as scrape_count
FROM performance_metrics 
WHERE timestamp >= NOW() - INTERVAL ? HOUR
AND response_time > 0 AND response_time < 300000
GROUP BY DATE_TRUNC('hour', timestamp)
ORDER BY hour`;

    const parameters = { hours: validatedHours };
    const queryId = this.logQuery(sql, parameters);
    const startTime = Date.now();
    
    try {
      // Mock trend data with bounds checking
      const mockTrends = Array.from({ length: Math.min(validatedHours, 24) }, (_, i) => ({
        hour: new Date(Date.now() - (i * 60 * 60 * 1000)).toISOString(),
        avg_response_time: Math.max(100, Math.min(30000, Math.random() * 3000 + 1000)),
        avg_complexity: Math.max(0, Math.min(100, Math.random() * 100 + 20)),
        avg_success_rate: Math.max(0, Math.min(1, Math.random() * 0.2 + 0.8)),
        scrape_count: Math.max(0, Math.min(1000, Math.floor(Math.random() * 10) + 1))
      }));
      
      await this.delay(150);
      
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, mockTrends.length);
      
      return mockTrends.reverse();
    } catch (error) {
      // Sanitize error message to prevent information disclosure
      const sanitizedError = this.sanitizeErrorMessage(error);
      console.error('Failed to query performance trends:', sanitizedError);
      throw new Error('Database query failed');
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      console.log('Disconnecting from SQLMagic server');
      this.connected = false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getQueryLog(): SQLMagicQuery[] {
    // Return a sorted copy (ascending by timestamp - oldest first)
    // so queryLog[queryLog.length - 1] returns the most recent query
    return [...this.queryLog].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  clearQueryLog(): void {
    this.queryLog = [];
  }

  async executeCustomQuery(sql: string, parameters?: Record<string, any>): Promise<any[]> {
    if (!this.connected) throw new Error('Not connected to SQLMagic server');

    // Enhanced SQL injection prevention
    if (!sql || typeof sql !== 'string') {
      throw new Error('Invalid query: SQL must be a non-empty string');
    }

    // Log the original query for security monitoring BEFORE sanitization
    // This allows security teams to detect and analyze suspicious queries
    const queryId = this.logQuery(sql, parameters);
    const startTime = Date.now();

    // Validate SQL query to prevent dangerous operations
    const sanitizedSql = this.validateAndSanitizeSQL(sql);
    if (!sanitizedSql) {
      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, 0);
      throw new Error('Query rejected: potentially dangerous SQL detected');
    }

    // Sanitize parameters
    const sanitizedParameters = parameters ? this.sanitizeQueryParameters(parameters) : undefined;

    try {
      // Mock execution with sanitized query
      console.log(`Executing custom query: ${sanitizedSql.substring(0, 50)}... [QUERY_TRUNCATED]`);
      await new Promise(resolve => setTimeout(resolve, 200));

      const mockResult = [{ message: 'Custom query executed successfully' }];

      const executionTime = Date.now() - startTime;
      this.updateQueryLog(queryId, executionTime, mockResult.length);

      return mockResult;
    } catch (error) {
      const sanitizedError = this.sanitizeErrorMessage(error);
      console.error('Failed to execute custom query:', sanitizedError);
      throw new Error('Database query execution failed');
    }
  }

  getDatabaseSchema(): SQLMagicTable[] {
    // Return the schema definition for visualization
    return [
      {
        name: 'html_graphs',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          url: 'TEXT NOT NULL',
          title: 'TEXT',
          analyzed_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
          total_objects: 'INTEGER',
          total_relationships: 'INTEGER',
          complexity: 'DECIMAL(10,2)',
          analysis_time: 'INTEGER',
          metadata: 'JSON'
        },
        indexes: ['url', 'analyzed_at', 'complexity'],
        constraints: []
      },
      {
        name: 'html_objects',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          graph_id: 'VARCHAR(255) NOT NULL',
          object_type: 'VARCHAR(100)',
          tag: 'VARCHAR(50)',
          semantic_role: 'VARCHAR(100)',
          schema_org_type: 'VARCHAR(100)',
          text_content: 'TEXT',
          depth: 'INTEGER',
          position_index: 'INTEGER',
          parent_id: 'VARCHAR(255)',
          size: 'INTEGER',
          attributes: 'JSON',
          created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        },
        indexes: ['graph_id', 'object_type', 'semantic_role', 'tag', 'parent_id'],
        constraints: ['FOREIGN KEY (graph_id) REFERENCES html_graphs(id)']
      },
      {
        name: 'html_relationships',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          graph_id: 'VARCHAR(255) NOT NULL',
          source_id: 'VARCHAR(255) NOT NULL',
          target_id: 'VARCHAR(255) NOT NULL',
          relationship_type: 'VARCHAR(50)',
          strength: 'DECIMAL(3,2)',
          metadata: 'JSON',
          created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        },
        indexes: ['graph_id', 'source_id', 'target_id', 'relationship_type'],
        constraints: [
          'FOREIGN KEY (graph_id) REFERENCES html_graphs(id)',
          'FOREIGN KEY (source_id) REFERENCES html_objects(id)',
          'FOREIGN KEY (target_id) REFERENCES html_objects(id)'
        ]
      },
      {
        name: 'performance_metrics',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          url: 'TEXT NOT NULL',
          timestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
          total_time: 'INTEGER',
          fetch_time: 'INTEGER',
          parse_time: 'INTEGER',
          analysis_time: 'INTEGER',
          retry_attempts: 'INTEGER',
          proxy_used: 'VARCHAR(100)',
          html_size: 'BIGINT',
          object_count: 'INTEGER',
          relationship_count: 'INTEGER',
          complexity: 'DECIMAL(10,2)',
          max_depth: 'INTEGER',
          response_time: 'INTEGER',
          content_length: 'BIGINT',
          content_type: 'VARCHAR(100)',
          status_code: 'INTEGER',
          success_rate: 'DECIMAL(3,2)',
          data_completeness: 'DECIMAL(3,2)',
          error_count: 'INTEGER',
          warning_count: 'INTEGER'
        },
        indexes: ['url', 'timestamp', 'complexity', 'success_rate'],
        constraints: []
      },
      {
        name: 'schema_org_data',
        schema: {
          id: 'VARCHAR(255) PRIMARY KEY',
          graph_id: 'VARCHAR(255) NOT NULL',
          schema_type: 'VARCHAR(100)',
          data: 'JSON',
          created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP'
        },
        indexes: ['graph_id', 'schema_type'],
        constraints: ['FOREIGN KEY (graph_id) REFERENCES html_graphs(id)']
      }
    ];
  }

  /**
   * Validate and sanitize SQL queries to prevent injection attacks
   */
  private validateAndSanitizeSQL(sql: string): string | null {
    // Block dangerous SQL commands and patterns
    const dangerousPatterns = [
      /\b(DROP|DELETE|INSERT|UPDATE|CREATE|ALTER|EXEC|EXECUTE|TRUNCATE|REPLACE)\b/gi,
      /\b(UNION|UNION\s+ALL)\b/gi,
      /(;|--|\/\*|\*\/|xp_|sp_)/gi,
      /\b(SCRIPT|JAVASCRIPT|VBSCRIPT)\b/gi,
      /(eval|exec|execute|system|cmd|shell)/gi
    ];
    
    for (const pattern of dangerousPatterns) {
      if (pattern.test(sql)) {
        return null;
      }
    }
    
    // Only allow SELECT statements for custom queries
    if (!sql.trim().toLowerCase().startsWith('select')) {
      return null;
    }
    
    // Limit query length to prevent DoS
    if (sql.length > 10000) {
      return null;
    }
    
    return sql.trim();
  }
  
  /**
   * Sanitize query parameters to prevent injection through parameters
   */
  private sanitizeQueryParameters(parameters: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(parameters)) {
      // Sanitize parameter names
      const sanitizedKey = key.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 100);
      if (!sanitizedKey) continue;
      
      // Sanitize parameter values
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = value.replace(/[;\x00\n\r\\"'\x1a]/g, '').substring(0, 1000);
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[sanitizedKey] = Math.max(-1000000, Math.min(1000000, value));
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value;
      }
      // Skip other types for security
    }
    
    return sanitized;
  }
  
  /**
   * Sanitize error messages to prevent information disclosure
   */
  private sanitizeErrorMessage(error: unknown): string {
    if (!error) return 'Unknown error';
    
    const errorMsg = error instanceof Error ? error.message : String(error);
    
    // Remove sensitive information from error messages
    return errorMsg
      .replace(/https?:\/\/[^\s]+/gi, '[URL_REDACTED]')
      .replace(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, '[IP_REDACTED]')
      .replace(/password|token|key|secret|auth/gi, '[CREDENTIAL_REDACTED]')
      .replace(/\b\w+@\w+\.\w+/g, '[EMAIL_REDACTED]')
      .substring(0, 200); // Limit error message length
  }
  
  /**
   * Cleanup method to properly dispose of resources and prevent memory leaks
   */
  cleanup(): void {
    try {
      // Clear all timeouts
      this.timeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      this.timeouts.clear();

      // Abort any pending operations
      if (this.abortController && !this.abortController.signal.aborted) {
        this.abortController.abort();
      }

      // Mark as disconnected
      this.connected = false;

      // Clear sensitive data
      this.clearQueryLog();

      console.log('SQLMagicIntegration cleanup completed');
    } catch (error) {
      const sanitizedError = this.sanitizeErrorMessage(error);
      console.warn('Error during SQLMagicIntegration cleanup:', sanitizedError);
    }
  }
}