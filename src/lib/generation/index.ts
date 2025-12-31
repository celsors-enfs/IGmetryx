import type { Locale, Tone, Length } from "./dictionaries/types";
import { extractKeywords } from "./keyword-extract";
import { generateCaptions } from "./captions";
import { generateHashtags } from "./hashtags";

export interface GenerationResult {
  captions: {
    variantA: string;
    variantB: string;
    variantC: string;
  };
  hashtags: {
    brand: string[];
    niche: string[];
    context: string[];
    mid: string[];
  };
  detectedNiche: string;
  confidence: number;
}

export function generateAll(
  input: string,
  locale: Locale,
  tone: Tone,
  length: Length,
  hashtagCount: number
): GenerationResult {
  // Normalize locale (already normalized, just use as-is)
  const normalizedLocale: Locale = locale;

  // Extract keywords and detect niche
  const extracted = extractKeywords(input, normalizedLocale);

  // Generate captions
  const captions = generateCaptions(input, normalizedLocale, tone, length, extracted);

  // Generate hashtags
  const hashtags = generateHashtags(input, normalizedLocale, hashtagCount, extracted);

  return {
    captions,
    hashtags,
    detectedNiche: extracted.detectedNiche,
    confidence: extracted.confidence,
  };
}

