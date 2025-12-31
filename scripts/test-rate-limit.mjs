#!/usr/bin/env node
/**
 * Simple test script for rate limiting
 * 
 * Usage:
 *   node scripts/test-rate-limit.mjs [route] [count]
 * 
 * Examples:
 *   node scripts/test-rate-limit.mjs captions 12
 *   node scripts/test-rate-limit.mjs feed-analyzer 6
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

async function testRateLimit(route, count = 5) {
  const routeMap = {
    'captions': '/api/ig/generate',
    'feed-analyzer': '/api/feed-analyzer/start',
  };
  
  const endpoint = routeMap[route];
  if (!endpoint) {
    console.error(`Unknown route: ${route}. Use 'captions' or 'feed-analyzer'`);
    process.exit(1);
  }
  
  console.log(`\n🧪 Testing rate limit for ${route} (${endpoint})`);
  console.log(`   Making ${count} requests...\n`);
  
  let allowedCount = 0;
  let blockedCount = 0;
  let lastHeaders = {};
  
  for (let i = 1; i <= count; i++) {
    try {
      let response;
      
      if (route === 'captions') {
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'both',
            language: 'en',
            tone: 'friendly',
            length: 'medium',
            hashtagCount: 15,
            topic: `Test request ${i}`,
          }),
        });
      } else {
        // Feed analyzer - would need actual images, so just test the endpoint exists
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      
      const headers = {
        'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
        'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
        'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset'),
        'Retry-After': response.headers.get('Retry-After'),
      };
      
      lastHeaders = headers;
      
      if (response.status === 429) {
        blockedCount++;
        const data = await response.json();
        console.log(`   ❌ Request ${i}: BLOCKED (429)`);
        console.log(`      Headers:`, headers);
        console.log(`      Message: ${data.error?.message || 'Rate limited'}`);
        console.log(`      Retry after: ${data.error?.retryAfterSec || headers['Retry-After']}s`);
      } else {
        allowedCount++;
        console.log(`   ✅ Request ${i}: ALLOWED (${response.status})`);
        console.log(`      Remaining: ${headers['X-RateLimit-Remaining']}/${headers['X-RateLimit-Limit']}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`   ⚠️  Request ${i}: ERROR - ${error.message}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Allowed: ${allowedCount}`);
  console.log(`   Blocked: ${blockedCount}`);
  console.log(`   Last headers:`, lastHeaders);
  
  if (blockedCount > 0) {
    console.log(`\n✅ Rate limiting is working!`);
  } else if (count <= 5) {
    console.log(`\n⚠️  No blocks detected. Try increasing count or check limits.`);
  }
}

const route = process.argv[2] || 'captions';
const count = parseInt(process.argv[3] || '5', 10);

testRateLimit(route, count).catch(console.error);

