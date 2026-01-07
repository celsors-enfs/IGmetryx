/**
 * Basic tests for caption and hashtag generation
 * Run with: npm test (if test framework is set up) or manually verify
 */

import { generateAll } from '../index';
import type { Locale, Tone, Length } from '../dictionaries/types';

// Manual test helper
export function testGeneration() {
  const testCases: Array<{
    input: string;
    locale: Locale;
    tone: Tone;
    length: Length;
    hashtagCount: number;
    description: string;
  }> = [
    {
      input: 'uma foto bonita minha no corcovado',
      locale: 'pt-BR',
      tone: 'friendly',
      length: 'medium',
      hashtagCount: 15,
      description: 'PT-BR travel photo',
    },
    {
      input: 'a beautiful photo of mine at corcovado',
      locale: 'en',
      tone: 'professional',
      length: 'short',
      hashtagCount: 10,
      description: 'EN travel photo',
    },
    {
      input: 'una foto bonita mía en el corcovado',
      locale: 'es',
      tone: 'friendly',
      length: 'long',
      hashtagCount: 20,
      description: 'ES travel photo',
    },
    {
      input: 'une belle photo de moi au corcovado',
      locale: 'fr',
      tone: 'motivational',
      length: 'medium',
      hashtagCount: 12,
      description: 'FR travel photo',
    },
  ];

  const results: Array<{
    description: string;
    passed: boolean;
    errors: string[];
  }> = [];

  for (const testCase of testCases) {
    const errors: string[] = [];
    
    try {
      const result = generateAll(
        testCase.input,
        testCase.locale,
        testCase.tone,
        testCase.length,
        testCase.hashtagCount
      );

      // Validate captions
      if (!result.captions.variantA || result.captions.variantA.length === 0) {
        errors.push('Variant A is empty');
      }
      if (!result.captions.variantB || result.captions.variantB.length === 0) {
        errors.push('Variant B is empty');
      }
      if (!result.captions.variantC || result.captions.variantC.length === 0) {
        errors.push('Variant C is empty');
      }

      // Validate variants are different
      if (result.captions.variantA === result.captions.variantB) {
        errors.push('Variant A and B are identical');
      }
      if (result.captions.variantA === result.captions.variantC) {
        errors.push('Variant A and C are identical');
      }

      // Validate hashtags
      const totalHashtags = 
        result.hashtags.brand.length +
        result.hashtags.niche.length +
        result.hashtags.context.length +
        result.hashtags.mid.length;
      
      if (testCase.hashtagCount > 0 && totalHashtags === 0) {
        errors.push('No hashtags generated when count > 0');
      }
      if (totalHashtags > testCase.hashtagCount + 2) {
        errors.push(`Too many hashtags: ${totalHashtags} (expected ~${testCase.hashtagCount})`);
      }

      // Validate language (basic check - no English stopwords in non-EN)
      if (testCase.locale !== 'en') {
        const englishStopwords = ['the', 'and', 'you', 'your', 'this', 'that'];
        const text = (result.captions.variantA + result.captions.variantB + result.captions.variantC).toLowerCase();
        const foundEnglish = englishStopwords.filter(w => new RegExp(`\\b${w}\\b`).test(text));
        if (foundEnglish.length > 2) {
          errors.push(`English words detected in ${testCase.locale} output: ${foundEnglish.join(', ')}`);
        }
      }

      // Validate hashtag uniqueness
      const allHashtags = [
        ...result.hashtags.brand,
        ...result.hashtags.niche,
        ...result.hashtags.context,
        ...result.hashtags.mid,
      ];
      const uniqueHashtags = new Set(allHashtags.map(h => h.toLowerCase()));
      if (uniqueHashtags.size < allHashtags.length) {
        errors.push('Duplicate hashtags found');
      }

      results.push({
        description: testCase.description,
        passed: errors.length === 0,
        errors,
      });
    } catch (error) {
      results.push({
        description: testCase.description,
        passed: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });
    }
  }

  return results;
}

// Export for manual testing
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  const results = testGeneration();
  console.log('\n=== Generation Tests ===\n');
  results.forEach(r => {
    console.log(`${r.passed ? '✓' : '✗'} ${r.description}`);
    if (r.errors.length > 0) {
      r.errors.forEach(e => console.log(`  - ${e}`));
    }
  });
  const passed = results.filter(r => r.passed).length;
  console.log(`\n${passed}/${results.length} tests passed\n`);
  
  if (passed < results.length) {
    process.exit(1);
  }
}




