import type { Locale } from "./dictionaries/types";
import { DICTS } from "./dictionaries";
import { sanitizeHashtag, uniqueKeepOrder, FORBIDDEN_GENERIC_TAGS } from "./rules";
import type { ExtractedKeywords } from "./keyword-extract";

export interface HashtagGroups {
  brand: string[];
  niche: string[];
  context: string[];
  mid: string[];
}

export function generateHashtags(
  input: string,
  locale: Locale,
  count: number,
  extracted: ExtractedKeywords
): HashtagGroups {
  if (count === 0) {
    return { brand: [], niche: [], context: [], mid: [] };
  }

  const dict = DICTS[locale];
  const nicheDict = dict.niche[extracted.detectedNiche];

  // Brand hashtags (from keywords, max 3)
  const brand: string[] = extracted.keywords
    .slice(0, 3)
    .map(k => sanitizeHashtag(k))
    .filter(t => t && !FORBIDDEN_GENERIC_TAGS.has(t.toLowerCase()));

  // Niche hashtags (from detected niche)
  const niche: string[] = nicheDict.hashtags
    .slice(0, Math.ceil(count * 0.4))
    .map(sanitizeHashtag)
    .filter(t => t && !FORBIDDEN_GENERIC_TAGS.has(t.toLowerCase()));

  // Context hashtags (location-based)
  const context: string[] = [];
  if (extracted.context.location) {
    const loc = extracted.context.location.toLowerCase().replace(/[^\w]/g, "");
    context.push(sanitizeHashtag(loc));
    if (locale === "pt-BR" && (loc.includes("rio") || loc.includes("são paulo"))) {
      context.push(sanitizeHashtag("brasil"));
    }
  }

  // Mid-reach hashtags
  const mid: string[] = nicheDict.midTags
    .slice(0, Math.ceil(count * 0.3))
    .map(sanitizeHashtag)
    .filter(t => t && !FORBIDDEN_GENERIC_TAGS.has(t.toLowerCase()));

  // Combine and limit to count
  const all = uniqueKeepOrder([...brand, ...niche, ...context, ...mid]);
  const limited = all.slice(0, count);

  // Redistribute to maintain proportions
  const brandCount = Math.min(brand.length, Math.ceil(limited.length * 0.15));
  const nicheCount = Math.ceil(limited.length * 0.4);
  const contextCount = Math.min(context.length, Math.ceil(limited.length * 0.1));
  const midCount = limited.length - brandCount - nicheCount - contextCount;

  return {
    brand: limited.slice(0, brandCount),
    niche: limited.slice(brandCount, brandCount + nicheCount),
    context: limited.slice(brandCount + nicheCount, brandCount + nicheCount + contextCount),
    mid: limited.slice(brandCount + nicheCount + contextCount),
  };
}




