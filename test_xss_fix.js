#!/usr/bin/env node
/**
 * XSS Vulnerability Fix Verification Test
 * Tests the enhanced input validation against common XSS attack vectors
 */

const { cleanText, htmlEntityEncode, sanitizeUrl } = require('./src/utils/validators.ts');

function testXSSVulnerabilities() {
    console.log('🔒 Testing XSS Vulnerability Fixes...\n');

    const xssTestCases = [
        // Basic script injection
        {
            name: 'Basic Script Tag',
            input: '<script>alert("XSS")</script>Hello World',
            expectation: 'Should remove script tags completely'
        },
        // Case variations
        {
            name: 'Script Tag Case Variations',
            input: '<SCRIPT>alert("XSS")</SCRIPT><Script>alert("XSS2")</Script>',
            expectation: 'Should handle case-insensitive script tags'
        },
        // Script with attributes
        {
            name: 'Script with Attributes',
            input: '<script type="text/javascript" src="malicious.js">alert("XSS")</script>',
            expectation: 'Should remove scripts with any attributes'
        },
        // Event handlers
        {
            name: 'Event Handler Attributes',
            input: '<div onclick="alert(\'XSS\')" onmouseover="maliciousFunction()">Content</div>',
            expectation: 'Should remove all event handlers'
        },
        // JavaScript protocol
        {
            name: 'JavaScript Protocol',
            input: '<a href="javascript:alert(\'XSS\')">Click me</a>',
            expectation: 'Should remove javascript: protocol'
        },
        // Iframe injection
        {
            name: 'Iframe Injection',
            input: '<iframe src="http://malicious.com/xss.html"></iframe>',
            expectation: 'Should remove iframe elements'
        },
        // SVG with script
        {
            name: 'SVG Script Injection',
            input: '<svg><script>alert("XSS")</script></svg>',
            expectation: 'Should remove SVG and script elements'
        },
        // Data URLs
        {
            name: 'Data URL Script',
            input: '<img src="data:text/html,<script>alert(\'XSS\')</script>">',
            expectation: 'Should remove data URLs'
        },
        // HTML entities in attributes
        {
            name: 'HTML Entity Encoding',
            input: '<div title="&quot;><script>alert(\'XSS\')</script>">Test</div>',
            expectation: 'Should properly encode HTML entities'
        },
        // Complex nested attack
        {
            name: 'Complex Nested Attack',
            input: '<div><script>var x="<script>alert(\'XSS\')</script>"</script><style>body{}</style></div>',
            expectation: 'Should handle nested malicious elements'
        },
        // CSS-based attack
        {
            name: 'Style-based Attack',
            input: '<style>@import url("javascript:alert(\'XSS\')");</style>',
            expectation: 'Should remove style elements completely'
        },
        // Form-based injection
        {
            name: 'Form Element Injection',
            input: '<form><input type="hidden" name="csrf" value=""><script>stealData()</script></form>',
            expectation: 'Should remove form elements and scripts'
        }
    ];

    let passed = 0;
    let total = xssTestCases.length;

    xssTestCases.forEach((testCase, index) => {
        console.log(`Test ${index + 1}: ${testCase.name}`);
        console.log(`Input: ${testCase.input}`);
        
        try {
            const result = cleanText(testCase.input);
            console.log(`Output: "${result}"`);
            
            // Check if the output contains any dangerous patterns
            const dangerousPatterns = [
                /<script/i,
                /javascript:/i,
                /on\w+\s*=/i,
                /<iframe/i,
                /<object/i,
                /<embed/i,
                /<style/i,
                /<svg/i,
                /<form/i,
                /data:\s*text\/html/i
            ];
            
            let safe = true;
            let foundPattern = '';
            
            for (const pattern of dangerousPatterns) {
                if (pattern.test(result)) {
                    safe = false;
                    foundPattern = pattern.toString();
                    break;
                }
            }
            
            if (safe) {
                console.log('✅ SAFE - No dangerous patterns found');
                passed++;
            } else {
                console.log(`❌ UNSAFE - Found dangerous pattern: ${foundPattern}`);
            }
            
        } catch (error) {
            console.log(`❌ ERROR - ${error.message}`);
        }
        
        console.log(`Expected: ${testCase.expectation}`);
        console.log('-'.repeat(70));
        console.log();
    });

    // Test HTML entity encoding separately
    console.log('Testing HTML Entity Encoding...');
    const entityTests = [
        { input: '<script>', expected: '&lt;script&gt;' },
        { input: '"evil"', expected: '&quot;evil&quot;' },
        { input: "it's", expected: 'it&#x27;s' },
        { input: 'a&b', expected: 'a&amp;b' },
        { input: '`backtick`', expected: '&#x60;backtick&#x60;' }
    ];

    entityTests.forEach((test, index) => {
        const result = htmlEntityEncode(test.input);
        if (result === test.expected) {
            console.log(`✅ Entity Test ${index + 1}: "${test.input}" → "${result}"`);
            passed++;
        } else {
            console.log(`❌ Entity Test ${index + 1}: "${test.input}" → "${result}" (expected: "${test.expected}")`);
        }
        total++;
    });

    // Test URL sanitization
    console.log('\nTesting URL Sanitization...');
    const urlTests = [
        { input: 'javascript:alert("XSS")', expected: '' },
        { input: 'data:text/html,<script>alert("XSS")</script>', expected: '' },
        { input: 'https://legitimate-site.com', expected: 'https://legitimate-site.com' },
        { input: '/relative/path', expected: '/relative/path' },
        { input: 'vbscript:msgbox("XSS")', expected: '' }
    ];

    urlTests.forEach((test, index) => {
        const result = sanitizeUrl(test.input);
        if (result === test.expected) {
            console.log(`✅ URL Test ${index + 1}: "${test.input}" → "${result}"`);
            passed++;
        } else {
            console.log(`❌ URL Test ${index + 1}: "${test.input}" → "${result}" (expected: "${test.expected}")`);
        }
        total++;
    });

    console.log(`\n${'='.repeat(70)}`);
    console.log(`XSS Fix Test Results: ${passed}/${total} tests passed`);
    
    if (passed === total) {
        console.log('🎉 ALL TESTS PASSED! XSS vulnerabilities have been successfully fixed.');
        return true;
    } else {
        console.log(`⚠️  ${total - passed} tests failed. Review the implementation.`);
        return false;
    }
}

// Performance test
function performanceTest() {
    console.log('\n🚀 Performance Test...');
    
    const largeInput = '<script>alert("XSS")</script>'.repeat(1000) + 
                      '<div onclick="malicious()">'.repeat(1000) + 
                      'Clean content here ' + '</div>'.repeat(1000);
    
    const startTime = Date.now();
    const result = cleanText(largeInput);
    const endTime = Date.now();
    
    console.log(`Processed ${largeInput.length} characters in ${endTime - startTime}ms`);
    console.log(`Output length: ${result.length} characters`);
    
    if (endTime - startTime < 1000) {
        console.log('✅ Performance: Processing completed in under 1 second');
        return true;
    } else {
        console.log('⚠️  Performance: Processing took longer than expected');
        return false;
    }
}

// Run tests
if (require.main === module) {
    const xssTestsPass = testXSSVulnerabilities();
    const performancePass = performanceTest();
    
    if (xssTestsPass && performancePass) {
        console.log('\n🔒 XSS Vulnerability Fix Verification: COMPLETE ✅');
        process.exit(0);
    } else {
        console.log('\n❌ Some tests failed. Please review the implementation.');
        process.exit(1);
    }
}

module.exports = { testXSSVulnerabilities, performanceTest };