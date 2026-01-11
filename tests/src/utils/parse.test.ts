import { describe, it, expect } from 'vitest';
import { parse } from 'node-html-parser';
import {
  getImages,
  getWebSite,
  getWebPage,
  getOrganizationFromMetadata,
  getMetadata
} from '../../../src/utils/parse';

describe('Schema.org Parse Functions', () => {
  const mockHtml = `
    <html lang="en">
      <head>
        <title>Test Website</title>
        <meta name="description" content="A test website for schema.org parsing">
        <meta name="keywords" content="test, schema, parsing">
        <meta name="author" content="Test Author">
        <meta property="og:site_name" content="Test Organization">
        <meta property="og:image" content="https://example.com/og-image.jpg">
        <meta property="article:published_time" content="2025-01-01T00:00:00Z">
        <meta property="article:modified_time" content="2025-01-02T00:00:00Z">
        <meta http-equiv="content-language" content="en-US">
      </head>
      <body>
        <h1>Main Title</h1>
        <h2>Section 1</h2>
        <h2>Section 2</h2>
        <p>First paragraph of content.</p>
        <p>Second paragraph with more details.</p>
        <a href="/internal-link" title="Internal Link">Internal Page</a>
        <a href="https://external.com" title="External Link">External Site</a>
        <img src="/image1.jpg" alt="First image" title="Image 1 Title" width="800" height="600">
        <img src="/image2.png" alt="Second image" width="400" height="300">
        <img src="/image3.webp" alt="Third image" title="WebP Image">
        <form role="search">
          <input type="text" name="q" placeholder="Search...">
        </form>
      </body>
    </html>
  `;

  const root = parse(mockHtml);

  describe('ImageObject Creation', () => {
    it('creates proper ImageObject structures with all schema.org properties', () => {
      const images = getImages(root, 10);
      
      expect(images).toHaveLength(3);
      
      const firstImage = images[0];
      expect(firstImage).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/image1.jpg',
        contentUrl: '/image1.jpg',
        name: 'Image 1 Title',
        alternateName: 'First image',
        description: 'First image',
        width: 800,
        height: 600,
        encodingFormat: 'image/jpeg'
      });

      const secondImage = images[1];
      expect(secondImage).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/image2.png',
        contentUrl: '/image2.png',
        name: 'Second image',
        alternateName: 'Second image',
        width: 400,
        height: 300,
        encodingFormat: 'image/png'
      });

      const thirdImage = images[2];
      expect(thirdImage).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/image3.webp',
        contentUrl: '/image3.webp',
        name: 'WebP Image',
        alternateName: 'Third image',
        encodingFormat: 'image/webp'
      });
    });

    it('handles images without dimensions', () => {
      const htmlWithoutDimensions = '<img src="/no-dims.gif" alt="No dimensions">';
      const testRoot = parse(htmlWithoutDimensions);
      const images = getImages(testRoot, 5);

      expect(images[0]).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'ImageObject',
        url: '/no-dims.gif',
        name: 'No dimensions',
        encodingFormat: 'image/gif'
      });
      expect(images[0]).not.toHaveProperty('width');
      expect(images[0]).not.toHaveProperty('height');
    });

    it('limits the number of images returned', () => {
      const images = getImages(root, 2);
      expect(images).toHaveLength(2);
    });
  });

  describe('WebSite Creation', () => {
    it('creates proper WebSite schema.org object', () => {
      const webSite = getWebSite(root, 'https://example.com/page');
      
      expect(webSite).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Test Website',
        url: 'https://example.com',
        description: 'A test website for schema.org parsing',
        inLanguage: 'en',
        keywords: ['test', 'schema', 'parsing']
      });
    });

    it('includes search action when search form is present', () => {
      const webSite = getWebSite(root, 'https://example.com/page');
      
      expect(webSite.potentialAction).toEqual([{
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://example.com/search?q={search_term_string}'
        },
        'query-input': 'required name=search_term_string'
      }]);
    });

    it('includes publisher when organization is detected', () => {
      const webSite = getWebSite(root, 'https://example.com/page');
      
      expect(webSite.publisher).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test Organization',
        url: 'https://example.com'
      });
    });
  });

  describe('WebPage Creation', () => {
    it('creates proper WebPage schema.org object', () => {
      const webSite = getWebSite(root, 'https://example.com/page');
      const webPage = getWebPage(root, 'https://example.com/page', webSite);
      
      expect(webPage).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Test Website',
        url: 'https://example.com/page',
        description: 'A test website for schema.org parsing',
        datePublished: '2025-01-01T00:00:00Z',
        dateModified: '2025-01-02T00:00:00Z',
        image: 'https://example.com/og-image.jpg',
        inLanguage: 'en',
        keywords: ['test', 'schema', 'parsing'],
        headline: 'Test Website',
        wordCount: expect.any(Number)
      });

      expect(webPage.author).toMatchObject({
        '@type': 'Person',
        name: 'Test Author'
      });

      expect(webPage.isPartOf).toEqual(webSite);
      expect(webPage.text).toEqual(['First paragraph of content.', 'Second paragraph with more details.']);
    });

    it('handles pages without author or dates', () => {
      const minimalHtml = '<html><head><title>Minimal</title></head><body><p>Content</p></body></html>';
      const minimalRoot = parse(minimalHtml);
      const webSite = getWebSite(minimalRoot, 'https://minimal.com');
      const webPage = getWebPage(minimalRoot, 'https://minimal.com', webSite);

      expect(webPage.author).toBeUndefined();
      expect(webPage.datePublished).toBeUndefined();
      expect(webPage.dateModified).toBeUndefined();
    });
  });

  describe('Organization Detection', () => {
    it('detects Capital Factory from URL', () => {
      const org = getOrganizationFromMetadata(root, 'https://capitalfactory.com/events');
      
      expect(org).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Capital Factory',
        url: 'https://capitalfactory.com',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '701 Brazos St',
          addressLocality: 'Austin',
          addressRegion: 'TX',
          postalCode: '78701',
          addressCountry: 'US'
        },
        sameAs: [
          'https://twitter.com/capitalfactory',
          'https://www.linkedin.com/company/capital-factory',
          'https://www.facebook.com/capitalfactory'
        ]
      });
    });

    it('detects Capital Factory from title content', () => {
      const cfHtml = '<html><head><title>Capital Factory Events</title></head></html>';
      const cfRoot = parse(cfHtml);
      const org = getOrganizationFromMetadata(cfRoot, 'https://other.com');
      
      expect(org).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Capital Factory'
      });
    });

    it('extracts organization from og:site_name', () => {
      const org = getOrganizationFromMetadata(root, 'https://example.com');
      
      expect(org).toMatchObject({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Test Organization',
        url: 'https://example.com'
      });
    });

    it('returns undefined when no organization is detected', () => {
      const noOrgHtml = '<html><head><title>Personal Blog</title></head></html>';
      const noOrgRoot = parse(noOrgHtml);
      const org = getOrganizationFromMetadata(noOrgRoot, 'https://personal.blog');
      
      expect(org).toBeUndefined();
    });
  });

  describe('Enhanced Metadata Extraction', () => {
    it('extracts subheaders correctly', () => {
      const metadata = getMetadata(root);
      
      expect(metadata.subheaders).toBe('Section 1\nSection 2');
      expect(metadata.description).toBe('A test website for schema.org parsing');
      expect(metadata.keywords).toBe('test, schema, parsing');
      expect(metadata.author).toBe('Test Author');
      expect(metadata['og:site_name']).toBe('Test Organization');
    });
  });
});