/**
 * Test API endpoints
 */

async function testAPI() {
  const baseUrl = 'http://localhost:3001';

  try {
    // Test health check
    console.log('\n1. Testing /health...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Health check:', JSON.stringify(healthData, null, 2));

    if (!healthData.status || healthData.status !== 'ok') {
      console.error('❌ Health check failed');
      return;
    }

    console.log('✅ Health check passed');

    // Test generation
    console.log('\n2. Testing /api/ig/generate...');
    const generateResponse = await fetch(`${baseUrl}/api/ig/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'both',
        language: 'en',
        tone: 'friendly',
        length: 'medium',
        hashtagCount: 15,
        topic: 'coffee morning',
      }),
    });

    const generateData = await generateResponse.json();
    console.log('Generation response:', JSON.stringify(generateData, null, 2));

    if (generateData.ok && generateData.result) {
      console.log('\n✅ Success!');
      console.log(`- Provider: ${generateData.meta.provider}`);
      console.log(`- Cache hit: ${generateData.meta.cache_hit}`);
      console.log(`- Captions: ${generateData.result.captions.short ? '✅' : '❌'} short, ${generateData.result.captions.medium ? '✅' : '❌'} medium, ${generateData.result.captions.long ? '✅' : '❌'} long`);
      console.log(`- Hashtags: ${generateData.result.hashtags.length} hashtags`);
    } else {
      console.log('\n❌ Error:', generateData.error?.message || 'Unknown error');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Make sure the API server is running: npm run dev:api');
    process.exit(1);
  }
}

testAPI();
