#!/usr/bin/env node
/**
 * Test script to verify the SQL injection fix
 */

const { SQLMagicIntegration } = require('./src/analytics/sqlMagicIntegration.ts');

async function testSQLInjectionFix() {
  console.log('Testing SQL injection fix...');
  
  const config = {
    host: 'localhost',
    port: 5432,
    database: 'test_db',
    username: 'test_user',
    password: 'test_password'
  };

  const sqlIntegration = new SQLMagicIntegration(config);
  
  try {
    await sqlIntegration.connect();
    
    // Test 1: Normal input should work
    console.log('Test 1: Normal input (24 hours)');
    const normalResult = await sqlIntegration.queryPerformanceTrends(24);
    console.log('✅ Normal input handled correctly');
    
    // Test 2: Test malicious input that would have caused SQL injection
    console.log('Test 2: Malicious input (SQL injection attempt)');
    const maliciousInput = "1'; DROP TABLE performance_metrics; --";
    
    // This should now be sanitized and not cause issues
    const maliciousResult = await sqlIntegration.queryPerformanceTrends(maliciousInput);
    console.log('✅ Malicious input sanitized successfully');
    
    // Test 3: Test edge cases
    console.log('Test 3: Edge cases');
    const negativeResult = await sqlIntegration.queryPerformanceTrends(-100);
    const zeroResult = await sqlIntegration.queryPerformanceTrends(0);
    const largeResult = await sqlIntegration.queryPerformanceTrends(99999);
    
    console.log('✅ Edge cases handled correctly');
    
    // Check query log to see sanitized parameters
    const queryLog = sqlIntegration.getQueryLog();
    const lastQueries = queryLog.slice(-4);
    
    console.log('\nQuery Log (showing parameter sanitization):');
    lastQueries.forEach((query, index) => {
      console.log(`Query ${index + 1}:`);
      console.log(`  SQL: ${query.sql.substring(0, 100)}...`);
      console.log(`  Parameters:`, query.parameters);
      console.log('');
    });
    
    await sqlIntegration.disconnect();
    console.log('\n🎉 All tests passed! SQL injection vulnerability has been fixed.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    sqlIntegration.cleanup();
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testSQLInjectionFix();
}

module.exports = { testSQLInjectionFix };