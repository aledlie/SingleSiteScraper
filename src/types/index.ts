export interface ScrapedData {
  title: string;
  description: string;
  links: Array<{ text: string; url: string }>;
  images: Array<{ src: string; alt: string }>;
  text: string[];
  metadata: Record<string, string>;
  events: Array<EventData>;
  status: {
    success: boolean;
    statusCode?: number;
    contentLength?: number;
    contentType?: string;
    responseTime?: number;
    proxyUsed?: string;
  };
}

export interface Proxies {
  name: string;
  url: string;
  headers?: Record<string, string>;
}

export interface ScrapeOptions {
  includeText: boolean;
  includeLinks: boolean;
  includeImages: boolean;
  includeMetadata: boolean;
  includeEvents: boolean;
  maxLinks: number;
  maxImages: number;
  maxTextElements: number;
  maxEvents: number;
  timeout: number;
  retryAttempts: number;
}

export interface TabOptions {
  text: string;
  links: string;
  images: string;
  metadata: string;
  events: string;
}

export interface FetchLikeResponse {
  ok: boolean;
  status: number;
  headers: Headers;
  text: () => Promise<string>;
  json: () => Promise<unknown>;
}

export interface EventData {
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  eventType?: string;
}

export interface AnalyticsConfig {
  enableAnalytics: boolean;
  enablePerformanceMonitoring: boolean;
  enableSQLStorage: boolean;
  generateGraphML: boolean;
  generateSchemaOrg: boolean;
  sqlConfig?: {
    host: string;
    port: number;
    database: string;
    username?: string;
    password?: string;
    ssl?: boolean;
  };
}

export interface EnhancedScrapedData extends ScrapedData {
  analytics?: {
    objectCount: number;
    relationshipCount: number;
    complexity: number;
    analysisTime: number;
    insights: string[];
  };
  graphML?: string;
  schemaOrg?: Record<string, any>;
}
