#!/usr/bin/env node

/**
 * Schema.org JSON-LD Validation Script
 * This script validates the JSON-LD structured data from our index.html
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractJsonLdFromHtml(htmlContent) {
  const jsonLdRegex = /<script\s+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const matches = [];
  let match;
  
  while ((match = jsonLdRegex.exec(htmlContent)) !== null) {
    try {
      const jsonString = match[1].trim();
      const jsonObject = JSON.parse(jsonString);
      matches.push(jsonObject);
    } catch (error) {
      console.error('Invalid JSON-LD found:', error.message);
      console.error('Content:', match[1]);
    }
  }
  
  return matches;
}

function validateSchemaOrgStructure(jsonObject) {
  const issues = [];
  
  // Check for required @context
  if (!jsonObject['@context']) {
    issues.push('Missing @context property');
  } else if (jsonObject['@context'] !== 'https://schema.org') {
    issues.push(`Invalid @context: ${jsonObject['@context']}, should be 'https://schema.org'`);
  }
  
  // Check for required @type
  if (!jsonObject['@type']) {
    issues.push('Missing @type property');
  }
  
  // Validate common required properties based on type
  const type = jsonObject['@type'];
  
  switch (type) {
    case 'WebApplication':
    case 'SoftwareApplication':
      if (!jsonObject.name) issues.push('WebApplication missing required "name" property');
      if (!jsonObject.description) issues.push('WebApplication missing recommended "description" property');
      if (!jsonObject.url) issues.push('WebApplication missing recommended "url" property');
      break;
      
    case 'WebSite':
      if (!jsonObject.name) issues.push('WebSite missing required "name" property');
      if (!jsonObject.url) issues.push('WebSite missing required "url" property');
      break;
      
    case 'FAQPage':
      if (!jsonObject.mainEntity || !Array.isArray(jsonObject.mainEntity)) {
        issues.push('FAQPage missing required "mainEntity" array');
      }
      break;
      
    case 'Organization':
      if (!jsonObject.name) issues.push('Organization missing required "name" property');
      break;
  }
  
  return issues;
}

function generateValidationReport(jsonLdObjects) {
  const report = {
    totalObjects: jsonLdObjects.length,
    validObjects: 0,
    invalidObjects: 0,
    issues: [],
    summary: {}
  };
  
  jsonLdObjects.forEach((obj, index) => {
    const issues = validateSchemaOrgStructure(obj);
    const objectType = obj['@type'] || 'Unknown';
    
    if (issues.length === 0) {
      report.validObjects++;
      console.log(`✅ Object ${index + 1} (${objectType}): Valid`);
    } else {
      report.invalidObjects++;
      console.log(`❌ Object ${index + 1} (${objectType}): ${issues.length} issues found`);
      issues.forEach(issue => {
        console.log(`   - ${issue}`);
        report.issues.push(`Object ${index + 1} (${objectType}): ${issue}`);
      });
    }
    
    // Count object types
    if (!report.summary[objectType]) {
      report.summary[objectType] = 0;
    }
    report.summary[objectType]++;
  });
  
  return report;
}

function main() {
  const htmlFilePath = path.join(__dirname, 'index.html');
  
  if (!fs.existsSync(htmlFilePath)) {
    console.error('index.html not found');
    process.exit(1);
  }
  
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
  const jsonLdObjects = extractJsonLdFromHtml(htmlContent);
  
  console.log('🔍 Schema.org JSON-LD Validation Report');
  console.log('=====================================\n');
  
  if (jsonLdObjects.length === 0) {
    console.log('❌ No JSON-LD structured data found in index.html');
    process.exit(1);
  }
  
  console.log(`Found ${jsonLdObjects.length} JSON-LD object(s)\n`);
  
  const report = generateValidationReport(jsonLdObjects);
  
  console.log('\n📊 Summary:');
  console.log(`Total objects: ${report.totalObjects}`);
  console.log(`Valid objects: ${report.validObjects}`);
  console.log(`Invalid objects: ${report.invalidObjects}`);
  
  console.log('\n📋 Object Types:');
  Object.entries(report.summary).forEach(([type, count]) => {
    console.log(`${type}: ${count}`);
  });
  
  if (report.issues.length > 0) {
    console.log('\n⚠️  Issues to Address:');
    report.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
  }
  
  console.log('\n🔗 Testing URLs:');
  console.log('Schema.org Validator: https://validator.schema.org/');
  console.log('Google Rich Results Test: https://search.google.com/test/rich-results');
  console.log('Google Structured Data Testing Tool: https://search.google.com/structured-data/testing-tool');
  
  if (report.invalidObjects === 0) {
    console.log('\n🎉 All JSON-LD objects passed basic validation!');
    console.log('Next steps:');
    console.log('1. Test with Google Rich Results Test tool');
    console.log('2. Test with Schema.org validator');
    console.log('3. Monitor Google Search Console for structured data reports');
  }
}

main();