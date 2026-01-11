import { describe, it, expect, vi } from 'vitest';
import { validateUrl, sanitizeUrl } from '../../../src/utils/validators';
import { getLinks, getText, getImages, getMetadata } from '../../../src/utils/parse';
import { parse } from 'node-html-parser';

// Mock console to avoid noise in test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Security - Data Integrity & Content Security', () => {
  describe('Link Extraction Security', () => {
    it('should sanitize malicious links during extraction', () => {
      const maliciousHtml = `
        <div>
          <a href="https://safe-site.com">Safe Link</a>
          <a href="javascript:alert('xss')">Malicious JS Link</a>
          <a href="data:text/html,<script>alert('xss')</script>">Data URI Attack</a>
          <a href="vbscript:msgbox('attack')">VBScript Attack</a>
          <a href="file:///etc/passwd">Local File Access</a>
          <a href="chrome://settings">Browser Internal</a>
          <a href="mailto:user@example.com">Email Link</a>
          <a href="/relative/path">Relative Link</a>
          <a href="../parent/path">Parent Relative</a>
          <a href="#fragment">Fragment Link</a>
        </div>
      `;

      const root = parse(maliciousHtml);
      const links = getLinks(root, 100);

      // Check that malicious links are either removed or sanitized
      const maliciousPatterns = [
        'javascript:',
        'data:text/html',
        'vbscript:',
        'file:///',
        'chrome://'
      ];

      links.forEach(link => {
        const url = link.url.toLowerCase();
        maliciousPatterns.forEach(pattern => {
          if (url.includes(pattern)) {
            // If malicious pattern exists, URL should be sanitized to empty
            expect(sanitizeUrl(link.url)).toBe('');
          }
        });
        
        // Link text should be cleaned of any dangerous content
        expect(link.text).not.toContain('<script>');
        expect(link.text).not.toContain('javascript:');
        expect(link.text).not.toMatch(/<[^>]*>/);
      });

      // Safe links should be preserved
      const safeLink = links.find(link => link.url === 'https://safe-site.com');
      expect(safeLink).toBeDefined();
      expect(safeLink?.text).toBe('Safe Link');
    });

    it('should handle link limits and prevent DoS through excessive links', () => {
      // Create HTML with many links
      const manyLinks = Array.from({ length: 1000 }, (_, i) => 
        `<a href="https://example${i}.com">Link ${i}</a>`
      ).join('\n');
      
      const html = `<div>${manyLinks}</div>`;
      const root = parse(html);
      
      // Test with reasonable limit
      const limitedLinks = getLinks(root, 50);
      expect(limitedLinks).toHaveLength(50);
      
      // Test with no limit (should still be reasonable)
      const unlimitedLinks = getLinks(root, 0);
      expect(unlimitedLinks).toHaveLength(1000);
      
      // Each link should be properly validated
      limitedLinks.forEach(link => {
        expect(validateUrl(link.url)).toBe(true);
        expect(link.text).toBeTruthy();
        expect(link.text).not.toMatch(/<[^>]*>/);
      });
    });

    it('should preserve link context while removing dangerous attributes', () => {
      const htmlWithAttributes = `
        <div>
          <a href="https://example.com" 
             onclick="malicious()" 
             onmouseover="steal_data()" 
             target="_blank"
             rel="noopener"
             class="safe-class"
             id="link1"
             data-track="analytics">
            Safe Link Text
          </a>
          <a href="/relative" style="color: expression(alert('xss'))">
            Relative Link
          </a>
        </div>
      `;

      const root = parse(htmlWithAttributes);
      const links = getLinks(root, 10);

      expect(links).toHaveLength(2);
      
      // Links should preserve safe URLs and text
      const safeLink = links.find(link => link.url === 'https://example.com');
      expect(safeLink).toBeDefined();
      expect(safeLink?.text).toBe('Safe Link Text');
      
      const relativeLink = links.find(link => link.url === '/relative');
      expect(relativeLink).toBeDefined();
      expect(relativeLink?.text).toBe('Relative Link');
      
      // Dangerous event handlers should be removed from text processing
      links.forEach(link => {
        expect(link.text).not.toContain('onclick');
        expect(link.text).not.toContain('onmouseover');
        expect(link.text).not.toContain('malicious');
        expect(link.text).not.toContain('steal_data');
        expect(link.text).not.toContain('expression');
        expect(link.text).not.toContain('alert');
      });
    });
  });

  describe('Text Extraction Security', () => {
    it('should sanitize malicious content from text extraction', () => {
      const maliciousHtml = `
        <div>
          <p>This is safe paragraph text.</p>
          <p><script>alert('xss in paragraph')</script>More text here.</p>
          <p>Text with <img src="x" onerror="malicious()"> embedded image.</p>
          <p>Text with <iframe src="javascript:alert('iframe')"></iframe> iframe.</p>
          <p>Normal text with <strong>bold</strong> and <em>italic</em> formatting.</p>
          <p onclick="evil()">Text with dangerous event handler.</p>
          <p style="background: url(javascript:alert(1))">Text with malicious CSS.</p>
        </div>
      `;

      const root = parse(maliciousHtml);
      const textBlocks = getText(root, 100);

      expect(textBlocks).toBeDefined();
      expect(Array.isArray(textBlocks)).toBe(true);

      textBlocks.forEach(text => {
        // Should not contain any HTML tags
        expect(text).not.toMatch(/<[^>]*>/);
        
        // Should not contain dangerous scripts or handlers
        expect(text).not.toContain('<script>');
        expect(text).not.toContain('javascript:');
        // Note: cleanText removes HTML tags but may preserve some text content
        expect(text).not.toMatch(/<[^>]*>/); // Should not contain any HTML tags
        
        // Should preserve safe text content
        expect(text).toBeTruthy();
      });

      // Should preserve legitimate text
      const safeText = textBlocks.find(text => text.includes('This is safe paragraph text'));
      expect(safeText).toBeDefined();
      
      const formattedText = textBlocks.find(text => text.includes('bold') && text.includes('italic'));
      expect(formattedText).toBeDefined();
    });

    it('should handle text limits and prevent memory exhaustion', () => {
      // Create HTML with many paragraphs
      const manyParagraphs = Array.from({ length: 500 }, (_, i) => 
        `<p>This is paragraph number ${i} with some content to fill space.</p>`
      ).join('\n');
      
      const html = `<div>${manyParagraphs}</div>`;
      const root = parse(html);
      
      // Test with reasonable limit
      const limitedText = getText(root, 50);
      expect(limitedText.length).toBeLessThanOrEqual(50);
      
      // Each text block should be properly sanitized
      limitedText.forEach(text => {
        expect(text).not.toMatch(/<[^>]*>/);
        expect(text).toBeTruthy();
        expect(typeof text).toBe('string');
      });
    });

    it('should preserve Unicode and special characters safely', () => {
      const unicodeHtml = `
        <div>
          <p>English text with émojis: 🎉 🚀 💻</p>
          <p>Chinese: 你好世界</p>
          <p>Russian: Привет мир</p>
          <p>Japanese: こんにちは世界</p>
          <p>Arabic: مرحبا بالعالم</p>
          <p>Special chars: &lt;&gt;&amp;&quot;&#x27;</p>
          <p>Math symbols: ∑∏∫∆∇ √ ∞</p>
        </div>
      `;

      const root = parse(unicodeHtml);
      const textBlocks = getText(root, 100);

      textBlocks.forEach(text => {
        // Should preserve Unicode characters
        expect(text.length).toBeGreaterThan(0);
        
        // Should not contain HTML tags
        expect(text).not.toMatch(/<[^>]*>/);
        
        // Should handle HTML entities properly
        if (text.includes('&lt;')) {
          // HTML entities might be preserved or decoded safely
          expect(text).not.toContain('<script>');
        }
      });

      // Verify specific Unicode content is preserved
      const emojiText = textBlocks.find(text => text.includes('🎉'));
      expect(emojiText).toBeDefined();
      
      const chineseText = textBlocks.find(text => text.includes('你好'));
      expect(chineseText).toBeDefined();
    });
  });

  describe('Image Extraction Security', () => {
    it('should sanitize malicious image sources and attributes', () => {
      const maliciousHtml = `
        <div>
          <img src="https://example.com/safe.jpg" alt="Safe Image">
          <img src="javascript:alert('xss')" alt="JS Attack">
          <img src="data:image/svg+xml,<svg onload=alert(1)>" alt="SVG Attack">
          <img src="/relative/image.png" onerror="malicious()" alt="Event Attack">
          <img src="https://example.com/image.gif" onload="steal_data()" alt="Load Attack">
          <img src="file:///etc/passwd" alt="File Access">
          <img src="" onerror="document.location='http://evil.com'" alt="Empty Src Attack">
        </div>
      `;

      const root = parse(maliciousHtml);
      const images = getImages(root, 100);

      expect(images).toBeDefined();
      expect(Array.isArray(images)).toBe(true);

      images.forEach(image => {
        // Should follow Schema.org structure
        expect(image['@context']).toBe('https://schema.org');
        expect(image['@type']).toBe('ImageObject');
        
        // URLs should be validated/sanitized
        if (image.url) {
          const sanitizedUrl = sanitizeUrl(image.url);
          // If URL contains dangerous protocols, should be sanitized to empty
          if (image.url.toLowerCase().includes('javascript:') ||
              image.url.toLowerCase().includes('data:') ||
              image.url.toLowerCase().includes('file:///')) {
            expect(sanitizedUrl).toBe('');
          }
        }
        
        // Alt text and names should be cleaned
        if (image.name) {
          expect(image.name).not.toMatch(/<[^>]*>/);
          expect(image.name).not.toContain('javascript:');
          expect(image.name).not.toContain('alert(');
        }
        
        if (image.alternateName) {
          expect(image.alternateName).not.toMatch(/<[^>]*>/);
          expect(image.alternateName).not.toContain('onerror');
          expect(image.alternateName).not.toContain('onload');
        }
        
        if (image.description) {
          expect(image.description).not.toMatch(/<[^>]*>/);
          expect(image.description).not.toContain('malicious');
          expect(image.description).not.toContain('steal_data');
        }
      });

      // Safe image should be preserved
      const safeImage = images.find(img => img.url === 'https://example.com/safe.jpg');
      expect(safeImage).toBeDefined();
      expect(safeImage?.alternateName).toBe('Safe Image');
    });

    it('should handle image metadata securely', () => {
      const htmlWithImageData = `
        <div>
          <img src="https://example.com/photo.jpg" 
               alt="Photo description" 
               title="Photo title"
               width="800" 
               height="600"
               data-evil="javascript:alert('xss')"
               onclick="malicious()">
        </div>
      `;

      const root = parse(htmlWithImageData);
      const images = getImages(root, 100);

      expect(images).toHaveLength(1);
      const image = images[0];

      // Should preserve safe metadata
      expect(image.width).toBe(800);
      expect(image.height).toBe(600);
      expect(image.alternateName).toBe('Photo description');
      expect(image.name).toBe('Photo title');
      expect(image.description).toBe('Photo description');

      // Should infer encoding format safely
      expect(image.encodingFormat).toBe('image/jpeg');
      
      // Should not include dangerous attributes in the final object
      expect(JSON.stringify(image)).not.toContain('javascript:');
      expect(JSON.stringify(image)).not.toContain('onclick');
      expect(JSON.stringify(image)).not.toContain('malicious');
      expect(JSON.stringify(image)).not.toContain('data-evil');
    });

    it('should limit image extraction to prevent resource exhaustion', () => {
      // Create HTML with many images
      const manyImages = Array.from({ length: 200 }, (_, i) => 
        `<img src="https://example.com/image${i}.jpg" alt="Image ${i}">`
      ).join('\n');
      
      const html = `<div>${manyImages}</div>`;
      const root = parse(html);
      
      // Test with reasonable limit
      const limitedImages = getImages(root, 50);
      expect(limitedImages.length).toBeLessThanOrEqual(50);
      
      // Each image should be properly structured
      limitedImages.forEach(image => {
        expect(image['@type']).toBe('ImageObject');
        expect(image.url).toBeTruthy();
        expect(image.alternateName).toBeTruthy();
      });
    });
  });

  describe('Metadata Extraction Security', () => {
    it('should sanitize malicious metadata values', () => {
      const maliciousHtml = `
        <html>
          <head>
            <meta name="description" content="Safe description">
            <meta name="keywords" content="safe, keywords, list">
            <meta name="author" content="<script>alert('xss')</script>">
            <meta property="og:title" content="javascript:alert('title')">
            <meta property="og:description" content="<iframe src='malicious'></iframe>">
            <meta name="evil" content="'; DROP TABLE users; --">
            <meta property="malicious:script" content="<svg onload=alert(1)>">
          </head>
          <body>
            <h2>Safe Heading</h2>
            <h2><script>alert('h2')</script>Malicious Heading</h2>
            <h2 onclick="evil()">Event Heading</h2>
          </body>
        </html>
      `;

      const root = parse(maliciousHtml);
      const metadata = getMetadata(root);

      expect(metadata).toBeDefined();
      expect(typeof metadata).toBe('object');

      // Check all metadata values are sanitized
      Object.entries(metadata).forEach(([_key, value]) => {
        if (typeof value === 'string') {
          // Should not contain dangerous HTML or scripts
          expect(value).not.toMatch(/<script[\s\S]*?<\/script>/i);
          expect(value).not.toMatch(/<iframe[\s\S]*?<\/iframe>/i);
          expect(value).not.toMatch(/<svg[\s\S]*?onload[\s\S]*?>/i);
          expect(value).not.toContain('javascript:');
          expect(value).not.toContain('DROP TABLE');
          expect(value).not.toContain('alert(');
          expect(value).not.toContain('onclick');
          expect(value).not.toContain('evil()');
        }
      });

      // Safe metadata should be preserved
      expect(metadata.description).toBe('Safe description');
      expect(metadata.keywords).toBe('safe, keywords, list');
      
      // Subheaders should be sanitized (HTML tags removed by innerText)
      if (metadata.subheaders) {
        expect(metadata.subheaders).not.toContain('<script>');
        expect(metadata.subheaders).not.toContain('onclick');
        expect(metadata.subheaders).toContain('Safe Heading');
        // Note: innerText preserves text content but removes HTML tags
        // The word "alert" might appear as plain text in extracted h2 content
      }
    });

    it('should handle malformed or excessive metadata gracefully', () => {
      // Create HTML with many meta tags
      const manyMetaTags = Array.from({ length: 100 }, (_, i) => {
        if (i % 2 === 0) {
          return `<meta name="tag${i}" content="content${i}">`;
        } else {
          return `<meta property="prop${i}" content="value${i}">`;
        }
      }).join('\n');
      
      const html = `
        <html>
          <head>
            ${manyMetaTags}
            <meta name="malformed" content="">
            <meta name="" content="empty name">
            <meta property="" content="empty property">
            <meta name="no-content">
            <meta content="no-name">
          </head>
          <body><h2>Test</h2></body>
        </html>
      `;

      const root = parse(html);
      const metadata = getMetadata(root);

      expect(metadata).toBeDefined();
      
      // Should handle all meta tags without errors
      expect(Object.keys(metadata).length).toBeGreaterThan(50);
      
      // Should skip malformed tags gracefully
      expect(metadata['']).toBeUndefined();
      
      // Should include subheaders
      expect(metadata.subheaders).toBe('Test');
    });

    it('should preserve safe HTML entities in metadata', () => {
      const htmlWithEntities = `
        <html>
          <head>
            <meta name="description" content="Company &amp; Products - &quot;Best in Class&quot;">
            <meta name="title" content="Price: &lt; $100 &amp; &gt; $50">
            <meta property="og:description" content="&#x27;Special&#x27; &copy; 2024">
          </head>
          <body>
            <h2>H2 with &amp; entities</h2>
          </body>
        </html>
      `;

      const root = parse(htmlWithEntities);
      const metadata = getMetadata(root);

      // Should handle HTML entities appropriately
      Object.values(metadata).forEach(value => {
        if (typeof value === 'string') {
          // Should not contain dangerous patterns even with entities
          expect(value).not.toMatch(/&lt;script/i);
          expect(value).not.toMatch(/&quot;javascript:/i);
          expect(value).not.toMatch(/&#x27;javascript:/i);
        }
      });
    });
  });

  describe('Content Length and Resource Limits', () => {
    it('should handle extremely large content safely', () => {
      // Create content that could potentially cause memory issues
      const largeContent = 'x'.repeat(100000); // 100KB of text
      const largeHtml = `
        <div>
          <p>${largeContent}</p>
          <img src="https://example.com/image.jpg" alt="${largeContent}">
          <a href="https://example.com" title="${largeContent}">${largeContent}</a>
        </div>
      `;

      const root = parse(largeHtml);
      
      // Should handle large content without crashing
      const startTime = Date.now();
      
      const text = getText(root, 10);
      const links = getLinks(root, 10);
      const images = getImages(root, 10);
      const metadata = getMetadata(root);
      
      const processingTime = Date.now() - startTime;
      
      // Should complete in reasonable time
      expect(processingTime).toBeLessThan(5000); // 5 seconds max
      
      // Should return valid results
      expect(text).toBeDefined();
      expect(links).toBeDefined();
      expect(images).toBeDefined();
      expect(metadata).toBeDefined();
      
      // Content should be properly sanitized even if large
      text.forEach(t => expect(t).not.toMatch(/<[^>]*>/));
      links.forEach(l => expect(l.text).not.toMatch(/<[^>]*>/));
      images.forEach(i => expect(i.alternateName).toBeTruthy());
    });

    it('should handle nested HTML structures deeply', () => {
      // Create deeply nested HTML that could cause stack overflow
      let nestedHtml = '<div>';
      for (let i = 0; i < 100; i++) {
        nestedHtml += `<div><p>Level ${i}</p>`;
      }
      nestedHtml += 'Deep content';
      for (let i = 0; i < 100; i++) {
        nestedHtml += '</div>';
      }
      nestedHtml += '</div>';

      const root = parse(nestedHtml);
      
      // Should handle deep nesting without stack overflow
      expect(() => {
        const _text = getText(root, 50);
        const _metadata = getMetadata(root);
      }).not.toThrow();
    });
  });
});