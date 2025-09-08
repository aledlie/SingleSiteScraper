import { scrapeAndAnalyze } from '../src/index.js';

const testResult = await scrapeAndAnalyze("https://aledlie.com");

console.log('Analysis result for aledlie.com:', testResult);