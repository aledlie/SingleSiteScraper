// Schema.org base interface
export interface SchemaOrgBase {
  '@context'?: string;
  '@type': string;
  '@id'?: string;
}

// Schema.org PostalAddress
export interface PostalAddress extends SchemaOrgBase {
  '@type': 'PostalAddress';
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

// Schema.org Place
export interface Place extends SchemaOrgBase {
  '@type': 'Place';
  name?: string;
  address?: PostalAddress | string;
  geo?: {
    '@type': 'GeoCoordinates';
    latitude?: number;
    longitude?: number;
  };
  url?: string;
  telephone?: string;
}

// Schema.org Organization
export interface Organization extends SchemaOrgBase {
  '@type': 'Organization';
  name: string;
  url?: string;
  logo?: string;
  address?: PostalAddress;
  telephone?: string;
  email?: string;
  sameAs?: string[];
}

// Schema.org Person
export interface Person extends SchemaOrgBase {
  '@type': 'Person';
  name: string;
  jobTitle?: string;
  affiliation?: Organization;
  url?: string;
  email?: string;
  telephone?: string;
}

// Schema.org ImageObject
export interface ImageObject extends SchemaOrgBase {
  '@type': 'ImageObject';
  url: string;
  name?: string;
  alternateName?: string;
  description?: string;
  contentUrl?: string;
  thumbnailUrl?: string;
  width?: number;
  height?: number;
  encodingFormat?: string;
}

// Schema.org Offer
export interface Offer extends SchemaOrgBase {
  '@type': 'Offer';
  price?: string;
  priceCurrency?: string;
  availability?: string;
  url?: string;
  validFrom?: string;
  validThrough?: string;
}

// Enhanced EventData with full schema.org Event properties
export interface EventData extends SchemaOrgBase {
  '@type': 'Event';
  name: string; // summary mapped to name
  startDate: string;
  endDate: string;
  location?: Place | string;
  description?: string;
  eventType?: string;
  url?: string;
  image?: ImageObject | string;
  performer?: Person | Organization | string;
  organizer?: Person | Organization;
  offers?: Offer[];
  eventAttendanceMode?: 'OfflineEventAttendanceMode' | 'OnlineEventAttendanceMode' | 'MixedEventAttendanceMode';
  eventStatus?: 'EventScheduled' | 'EventCancelled' | 'EventMovedOnline' | 'EventPostponed' | 'EventRescheduled';
  audience?: string;
  doorTime?: string;
  duration?: string;
  inLanguage?: string;
  isAccessibleForFree?: boolean;
  keywords?: string[];
  maximumAttendeeCapacity?: number;
  recordedIn?: string;
  remainingAttendeeCapacity?: number;
  review?: any[];
  sponsor?: Organization | Person;
  subEvent?: EventData[];
  superEvent?: EventData;
  typicalAgeRange?: string;
  workFeatured?: any;
  workPerformed?: any;
}

// Schema.org WebSite
export interface WebSite extends SchemaOrgBase {
  '@type': 'WebSite';
  name: string;
  url: string;
  description?: string;
  publisher?: Organization | Person;
  author?: Person | Organization;
  inLanguage?: string;
  keywords?: string[];
  copyrightYear?: number;
  copyrightHolder?: Organization | Person;
  license?: string;
  mainEntity?: any;
  potentialAction?: any[];
  sameAs?: string[];
}

// Schema.org WebPage
export interface WebPage extends SchemaOrgBase {
  '@type': 'WebPage';
  name: string;
  url: string;
  description?: string;
  mainEntity?: any;
  isPartOf?: WebSite;
  datePublished?: string;
  dateModified?: string;
  author?: Person | Organization;
  publisher?: Organization | Person;
  image?: ImageObject | string;
  inLanguage?: string;
  keywords?: string[];
  headline?: string;
  articleBody?: string;
  wordCount?: number;
  text?: string[];
  about?: any;
  mentions?: any[];
  citation?: any[];
  license?: string;
}

export interface ScrapedData {
  '@context'?: string;
  '@type'?: 'Dataset' | 'DigitalDocument';
  title: string;
  description: string;
  links: Array<{ text: string; url: string }>;
  images: Array<ImageObject>;
  text: string[];
  metadata: Record<string, string>;
  events: Array<EventData>;
  webSite?: WebSite;
  webPage?: WebPage;
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
