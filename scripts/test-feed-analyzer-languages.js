/**
 * Test Feed Analyzer with all languages
 * 
 * Usage: node scripts/test-feed-analyzer-languages.js
 * 
 * Requires:
 * - Server running on localhost:3001
 * - DEEPSEEK_API_KEY configured (optional, will use fallback if not set)
 */

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

// Mock image data (base64 placeholder - in real test, use actual images)
const MOCK_IMAGE_DATA = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testLanguage(language, contentType, desiredVibe) {
  console.log(`\n🧪 Testing ${language} with contentType="${contentType}", vibe="${desiredVibe}"...`);
  
  try {
    // Create FormData (in real test, use actual image files)
    const formData = new FormData();
    
    // Add 9 mock images (in real test, use actual File objects)
    for (let i = 0; i < 9; i++) {
      // Note: This is a placeholder - real test needs actual image files
      // formData.append(`image${i}`, imageFile);
    }
    
    formData.append('imageCount', '9');
    formData.append('language', language);
    if (contentType) formData.append('contentType', contentType);
    if (desiredVibe) formData.append('desiredVibe', desiredVibe);
    
    const response = await fetch(`${API_BASE_URL}/api/feed-analyzer/start`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to start job: ${errorText}`);
      return false;
    }
    
    const data = await response.json();
    const jobId = data.jobId;
    
    console.log(`✅ Job started: ${jobId}`);
    console.log(`   Waiting for completion...`);
    
    // Poll for status
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await fetch(`${API_BASE_URL}/api/feed-analyzer/status/${jobId}`);
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'done') {
        // Get result
        const resultResponse = await fetch(`${API_BASE_URL}/api/feed-analyzer/result/${jobId}`);
        const resultData = await resultResponse.json();
        
        if (resultData.ok && resultData.result) {
          const result = resultData.result;
          
          // Validate structure
          const hasScore = typeof result.score === 'number';
          const hasScoreLabel = typeof result.scoreLabel === 'string';
          const hasBreakdown = result.breakdown && typeof result.breakdown === 'object';
          const hasInsights = Array.isArray(result.insights) && result.insights.length >= 3;
          const hasRecommendations = Array.isArray(result.recommendations) && result.recommendations.length === 3;
          const hasNextPost = typeof result.nextPostGuidance === 'string';
          
          console.log(`\n📊 Results for ${language}:`);
          console.log(`   Score: ${result.score}/100 (${result.scoreLabel})`);
          console.log(`   Insights: ${result.insights.length}`);
          console.log(`   Recommendations: ${result.recommendations.length}`);
          console.log(`   Next Post: ${result.nextPostGuidance.substring(0, 60)}...`);
          
          // Check language
          const allText = [
            result.scoreLabel,
            ...result.insights,
            ...result.recommendations,
            result.nextPostGuidance,
          ].join(' ');
          
          // Basic language check (not perfect, but helps)
          const isEnglish = /the|and|with|your|feed/i.test(allText);
          const isSpanish = /el|la|tu|feed|con|para/i.test(allText);
          const isPortuguese = /o|a|seu|feed|com|para/i.test(allText);
          const isFrench = /le|la|votre|feed|avec|pour/i.test(allText);
          
          let detectedLang = 'unknown';
          if (isEnglish && language === 'EN') detectedLang = 'EN';
          else if (isSpanish && language === 'ES') detectedLang = 'ES';
          else if (isPortuguese && language === 'PT-BR') detectedLang = 'PT-BR';
          else if (isFrench && language === 'FR') detectedLang = 'FR';
          
          console.log(`   Language match: ${detectedLang === language ? '✅' : '⚠️'} (detected: ${detectedLang})`);
          
          // Check for numeric references
          const hasMetrics = /\d+%|\d+\.\d+%|brightness|contrast|saturation|brilho|contraste|saturación|luminosité/i.test(allText);
          console.log(`   Metric references: ${hasMetrics ? '✅' : '⚠️'}`);
          
          // Check structure
          const structureValid = hasScore && hasScoreLabel && hasBreakdown && hasInsights && hasRecommendations && hasNextPost;
          console.log(`   Structure valid: ${structureValid ? '✅' : '❌'}`);
          
          return structureValid && detectedLang === language;
        } else {
          console.error(`❌ Invalid result structure`);
          return false;
        }
      } else if (statusData.status === 'failed') {
        console.error(`❌ Job failed`);
        return false;
      }
      
      attempts++;
      process.stdout.write('.');
    }
    
    console.error(`\n❌ Timeout waiting for job completion`);
    return false;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Feed Analyzer Language & Quality Tests\n');
  console.log('⚠️  Note: This test requires actual image files.');
  console.log('   Update the script to use real File objects from fs.\n');
  
  const languages = ['EN', 'PT-BR', 'ES', 'FR'];
  const contentTypes = ['Personal Brand', 'Business', 'Creator', 'Portfolio', undefined];
  const vibes = ['Clean', 'Bold', 'Editorial', 'Minimal', undefined];
  
  const results = [];
  
  // Test each language with different combinations
  for (const lang of languages) {
    // Test with different contentType/vibe combinations
    const testCases = [
      { contentType: 'Personal Brand', vibe: 'Clean' },
      { contentType: 'Business', vibe: 'Bold' },
      { contentType: undefined, vibe: undefined },
    ];
    
    for (const testCase of testCases) {
      const result = await testLanguage(lang, testCase.contentType, testCase.vibe);
      results.push({
        language: lang,
        contentType: testCase.contentType || 'none',
        vibe: testCase.vibe || 'none',
        passed: result,
      });
      
      // Wait between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Summary
  console.log('\n\n📊 Test Summary:');
  console.log('================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.language} (${r.contentType}, ${r.vibe})`);
  });
  
  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
    process.exit(1);
  }
}

// Check if server is running
fetch(`${API_BASE_URL}/api/feed-analyzer/status/test`)
  .then(() => {
    console.log('✅ Server is running');
    runTests();
  })
  .catch(() => {
    console.error('❌ Server is not running. Start it with: npm run dev:api');
    process.exit(1);
  });

