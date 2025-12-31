/**
 * Simple test script to verify API endpoint works correctly
 * Run with: node test-api.js
 */

const testRequest = {
  type: 'both',
  language: 'en',
  tone: 'friendly',
  length: 'medium',
  hashtagCount: 15,
  topic: 'rio de janeiro'
};

async function testAPI() {
  try {
    console.log('Testing /api/ig/generate endpoint...');
    console.log('Request:', JSON.stringify(testRequest, null, 2));
    
    const response = await fetch('http://localhost:3001/api/ig/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testRequest),
    });

    const data = await response.json();
    
    console.log('\n=== RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Validate response structure
    console.log('\n=== VALIDATION ===');
    
    if (data.captions) {
      console.log('✅ captions present');
      console.log('  - short:', data.captions.short?.substring(0, 50) || 'MISSING');
      console.log('  - medium:', data.captions.medium?.substring(0, 50) || 'MISSING');
      console.log('  - long:', data.captions.long?.substring(0, 50) || 'MISSING');
      
      // Check for placeholders
      if (data.captions.short?.includes('[rio de janeiro]') || data.captions.short?.includes('[')) {
        console.error('❌ PLACEHOLDER DETECTED in short caption:', data.captions.short);
      } else {
        console.log('✅ No placeholders in captions');
      }
    } else {
      console.error('❌ captions missing');
    }
    
    if (data.hashtags) {
      console.log('✅ hashtags present');
      const total = (data.hashtags.broad?.length || 0) + 
                    (data.hashtags.niche?.length || 0) + 
                    (data.hashtags.discovery?.length || 0);
      console.log('  - Total hashtags:', total, '(expected:', testRequest.hashtagCount, ')');
      console.log('  - broad:', data.hashtags.broad?.length || 0);
      console.log('  - niche:', data.hashtags.niche?.length || 0);
      console.log('  - discovery:', data.hashtags.discovery?.length || 0);
    } else {
      console.error('❌ hashtags missing');
    }
    
    if (data.meta) {
      console.log('✅ meta present');
      console.log('  - provider:', data.meta.provider);
      console.log('  - cached:', data.meta.cached);
    } else {
      console.error('❌ meta missing');
    }
    
    console.log('\n=== TEST COMPLETE ===');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    console.error(error.stack);
  }
}

testAPI();

