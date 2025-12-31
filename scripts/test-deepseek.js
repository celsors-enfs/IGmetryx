/**
 * Proof Test: Verify DeepSeek is being used (not fallback templates)
 * 
 * This test:
 * 1. Calls the API twice with the same input
 * 2. Asserts first call has _cache=miss, second has _cache=hit
 * 3. Asserts _provider is "deepseek"
 * 4. Asserts captions are contextualized (not template patterns)
 */

const API_BASE_URL = 'http://localhost:3001';
const TEST_TOPIC = 'coffee morning routine';

// Fallback template patterns to detect
const FALLBACK_PATTERNS = [
  /^Acabei de visitar /i,
  /^Just /i,
  /^Je viens de visiter /i,
  /^¡Acabo de visitar /i,
  /^Exploring /i,
  /^Discovering /i,
];

function containsFallbackPattern(text) {
  return FALLBACK_PATTERNS.some(pattern => pattern.test(text));
}

function isContextualized(caption, topic) {
  // Check if caption contains more than just the topic string
  const topicWords = topic.toLowerCase().split(/\s+/);
  const captionLower = caption.toLowerCase();
  
  // If caption is just "topic!" or "Just topic!", it's a template
  if (captionLower.trim() === `${topic.toLowerCase()}!` || 
      captionLower.trim() === `just ${topic.toLowerCase()}!`) {
    return false;
  }
  
  // Check if it contains template patterns
  if (containsFallbackPattern(caption)) {
    return false;
  }
  
  // Good: caption has more words than just the topic
  const captionWords = captionLower.split(/\s+/).length;
  return captionWords > topicWords.length + 2;
}

async function testDeepSeek() {
  console.log('\n🧪 DeepSeek Proof Test\n');
  console.log('='.repeat(60));
  
  try {
    // Test 1: First call (should be cache miss)
    console.log('\n📤 Test 1: First API call (expecting cache miss)...');
    const response1 = await fetch(`${API_BASE_URL}/api/ig/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'both',
        language: 'en',
        tone: 'friendly',
        length: 'medium',
        hashtagCount: 10,
        topic: TEST_TOPIC,
      }),
    });

    if (!response1.ok) {
      throw new Error(`HTTP ${response1.status}: ${await response1.text()}`);
    }

    const data1 = await response1.json();
    
    console.log('✅ Response received');
    console.log(`   _provider: ${data1._provider}`);
    console.log(`   _cache: ${data1._cache}`);
    console.log(`   meta.provider: ${data1.meta?.provider}`);
    console.log(`   meta.cache_hit: ${data1.meta?.cache_hit}`);

    // Assertions for first call
    if (data1._cache !== 'miss') {
      throw new Error(`❌ FAIL: Expected _cache='miss', got '${data1._cache}'`);
    }
    console.log('✅ PASS: First call has _cache=miss');

    if (data1._provider !== 'deepseek') {
      throw new Error(`❌ FAIL: Expected _provider='deepseek', got '${data1._provider}'. DeepSeek API key may not be configured.`);
    }
    console.log('✅ PASS: _provider is "deepseek"');

    if (!data1.result?.captions?.short) {
      throw new Error('❌ FAIL: Missing captions in response');
    }

    // Check if captions are contextualized
    const shortCaption = data1.result.captions.short;
    const mediumCaption = data1.result.captions.medium;
    const longCaption = data1.result.captions.long;

    console.log(`\n📝 Generated captions:`);
    console.log(`   Short: "${shortCaption.substring(0, 80)}..."`);
    console.log(`   Medium: "${mediumCaption.substring(0, 80)}..."`);
    console.log(`   Long: "${longCaption.substring(0, 80)}..."`);

    if (containsFallbackPattern(shortCaption) || 
        containsFallbackPattern(mediumCaption) || 
        containsFallbackPattern(longCaption)) {
      throw new Error('❌ FAIL: Captions contain fallback template patterns. DeepSeek may not be working.');
    }
    console.log('✅ PASS: No fallback template patterns detected');

    if (!isContextualized(shortCaption, TEST_TOPIC) || 
        !isContextualized(mediumCaption, TEST_TOPIC) || 
        !isContextualized(longCaption, TEST_TOPIC)) {
      throw new Error('❌ FAIL: Captions are not contextualized. They appear to be template-based.');
    }
    console.log('✅ PASS: Captions are contextualized (not just topic substitution)');

    // Check hashtags
    if (!data1.result?.hashtags || data1.result.hashtags.length === 0) {
      throw new Error('❌ FAIL: No hashtags in response');
    }
    console.log(`✅ PASS: Hashtags generated (${data1.result.hashtags.length} hashtags)`);

    // Test 2: Second call (should be cache hit)
    console.log('\n📤 Test 2: Second API call (expecting cache hit)...');
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay

    const response2 = await fetch(`${API_BASE_URL}/api/ig/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'both',
        language: 'en',
        tone: 'friendly',
        length: 'medium',
        hashtagCount: 10,
        topic: TEST_TOPIC,
      }),
    });

    if (!response2.ok) {
      throw new Error(`HTTP ${response2.status}: ${await response2.text()}`);
    }

    const data2 = await response2.json();

    console.log('✅ Response received');
    console.log(`   _provider: ${data2._provider}`);
    console.log(`   _cache: ${data2._cache}`);

    // Assertions for second call
    if (data2._cache !== 'hit') {
      throw new Error(`❌ FAIL: Expected _cache='hit' on second call, got '${data2._cache}'`);
    }
    console.log('✅ PASS: Second call has _cache=hit');

    if (data2._provider !== 'deepseek') {
      throw new Error(`❌ FAIL: Expected _provider='deepseek', got '${data2._provider}'`);
    }
    console.log('✅ PASS: _provider is still "deepseek"');

    // Verify cached response matches
    if (data2.result.captions.short !== data1.result.captions.short) {
      throw new Error('❌ FAIL: Cached response does not match original');
    }
    console.log('✅ PASS: Cached response matches original');

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ DeepSeek is working correctly');
    console.log('✅ Cache is working correctly');
    console.log('✅ Captions are contextualized (not template-based)');
    console.log('\n📋 Summary:');
    console.log(`   Provider: ${data1._provider}`);
    console.log(`   First call cache: ${data1._cache}`);
    console.log(`   Second call cache: ${data2._cache}`);
    console.log(`   Captions are unique and contextualized`);
    console.log('\n');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ TEST FAILED');
    console.error('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Ensure API server is running: npm run dev:api');
    console.error('   2. Check .env.local has DEEPSEEK_API_KEY configured');
    console.error('   3. Verify health check: curl http://localhost:3001/health');
    console.error('   4. Check server logs for DeepSeek errors');
    console.error('\n');
    process.exit(1);
  }
}

// Run test
testDeepSeek();

