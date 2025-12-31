/**
 * Unified API Endpoint: /api/ig/generate
 * 
 * Generates Instagram captions and/or hashtags using DeepSeek API
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { callDeepSeek } from '../lib/deepseek.js';
import { buildSystemPrompt, buildUserPrompt } from '../lib/prompts.js';
import { Cache } from '../../lib/cache.js';
import { generateTemplates } from '../template-generator.js';

// Request validation schema
const requestSchema = z.object({
  type: z.enum(['captions', 'hashtags', 'both']).default('both'),
  language: z.enum(['pt-BR', 'en', 'es', 'fr']),
  tone: z.enum(['friendly', 'professional', 'fun', 'funny', 'minimalist', 'inspirational', 'casual', 'conversational', 'humorous', 'authoritative', 'sarcastic', 'emotional', 'storytelling', 'creative', 'engaging']).default('friendly'),
  length: z.enum(['short', 'medium', 'long']).default('medium'),
  hashtagCount: z.number().int().min(0).max(30).default(15),
  topic: z.string().min(1).max(500),
});

type RequestBody = z.infer<typeof requestSchema>;

// Standardized API response type
interface StandardApiResponse {
  ok: boolean;
  result?: {
    captions: {
      short: string;
      medium: string;
      long: string;
    };
    hashtags: string[];
    language: string;
    tone: string;
    length: string;
    hashtagCount: number;
    topic: string;
  };
  meta: {
    cache_hit: boolean;
    provider: 'deepseek' | 'fallback';
    request_id: string;
  };
  // Internal fields (not shown in UI)
  _provider?: 'deepseek' | 'fallback';
  _cache?: 'hit' | 'miss';
  error?: {
    message: string;
    code?: string;
  };
}

// Cache instance
const cache = new Cache<StandardApiResponse>({
  ttlMs: 6 * 60 * 60 * 1000, // 6 hours
  maxSize: 500,
});

// Rate limiting: track by IP
interface RateLimitEntry {
  requests: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_PER_WINDOW = 20;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Get client IP from request
 */
function getClientIP(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || 'unknown';
}

/**
 * Check rate limit
 */
function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(ip, {
      requests: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS,
    });
    return { allowed: true };
  }

  if (entry.requests >= RATE_LIMIT_PER_WINDOW) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.requests++;
  return { allowed: true };
}

/**
 * Generate request ID
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 11);
}

/**
 * Normalize topic for cache key
 */
function normalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .substring(0, 120);
}

/**
 * Generate cache key
 */
function generateCacheKey(body: RequestBody): string {
  const normalizedTopic = normalizeTopic(body.topic);
  const keyParts = [
    body.language,
    body.tone,
    body.length,
    String(body.hashtagCount),
    normalizedTopic,
  ];
  return Cache.generateKey(...keyParts);
}

/**
 * Parse hashtags string into array
 */
function parseHashtags(hashtagsStr: string, requestedCount: number): string[] {
  const hashtags = hashtagsStr
    .split(/\s+/)
    .filter(tag => tag.startsWith('#') && tag.length > 1)
    .filter((tag, index, arr) => arr.indexOf(tag) === index); // Remove duplicates
  
  if (hashtags.length === requestedCount) {
    return hashtags;
  }
  
  if (hashtags.length > requestedCount) {
    return hashtags.slice(0, requestedCount);
  }
  
  // If too few, pad with variations (still meaningful)
  const baseTags = hashtags.slice();
  while (baseTags.length < requestedCount && baseTags.length > 0) {
    const lastTag = baseTags[baseTags.length - 1];
    const variation = `${lastTag}${baseTags.length}`;
    if (!baseTags.includes(variation)) {
      baseTags.push(variation);
    } else {
      break; // Avoid infinite loop
    }
  }
  
  return baseTags.slice(0, requestedCount);
}

/**
 * Repair malformed JSON - fix unquoted hashtags in array
 */
function repairJsonString(jsonString: string): string {
  let repaired = jsonString;
  
  // Find the hashtags array and fix it specifically
  const hashtagsArrayRegex = /"hashtags"\s*:\s*\[([^\]]+)\]/;
  const match = repaired.match(hashtagsArrayRegex);
  
  if (match) {
    const hashtagsContent = match[1];
    console.log('[API] 🔧 Found hashtags array, content:', hashtagsContent.substring(0, 200));
    
    // Split by comma and fix each hashtag
    const fixedHashtags = hashtagsContent
      .split(',')
      .map(tag => {
        let trimmed = tag.trim();
        
        // Handle case: #hashtag" (missing opening quote)
        // Pattern: #something" -> "#something"
        if (trimmed.match(/^#[^"]+"$/)) {
          trimmed = trimmed.replace(/"$/, '');
          return `"${trimmed}"`;
        }
        
        // Handle case: "#hashtag (missing closing quote) - less common but possible
        if (trimmed.match(/^"[^"]*$/)) {
          return `${trimmed}"`;
        }
        
        // Remove any existing quotes to normalize
        trimmed = trimmed.replace(/^["']+|["']+$/g, '');
        
        // If it starts with #, ensure it's quoted
        if (trimmed.startsWith('#')) {
          return `"${trimmed}"`;
        }
        
        // If it's already properly quoted, return as-is
        if (tag.trim().startsWith('"') && tag.trim().endsWith('"')) {
          return tag.trim();
        }
        
        // Otherwise, quote it
        return `"${trimmed}"`;
      })
      .filter(tag => {
        // Filter out empty and ensure it's a valid hashtag
        const content = tag.replace(/^["']+|["']+$/g, '');
        return content.length > 1 && content.startsWith('#');
      })
      .join(', ');
    
    // Replace the hashtags array with the fixed version
    repaired = repaired.replace(
      hashtagsArrayRegex,
      `"hashtags": [${fixedHashtags}]`
    );
    
    console.log('[API] 🔧 Fixed hashtags array');
  }
  
  // Also fix general patterns in the entire JSON string
  // Fix: , #hashtag" -> , "#hashtag"
  repaired = repaired.replace(/([,[])\s*#([^",\]]+)"?/g, '$1"#$2"');
  
  // Fix: "#tag1", #tag2" -> "#tag1", "#tag2"
  repaired = repaired.replace(/(["\]])\s*,\s*#([^",\]]+)"?/g, '$1, "#$2"');
  
  return repaired;
}

/**
 * Parse DeepSeek JSON response
 */
function parseDeepSeekResponse(content: string, hashtagCount: number): { captions: { short: string; medium: string; long: string }; hashtags: string[] } {
  // Extract JSON from response (may have markdown code fences)
  let jsonString = content.trim();
  
  // Remove markdown code fences if present
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  // Try to find JSON object in string
  const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonString = jsonMatch[0];
  }
  
  console.log('[API] 📥 Parsing DeepSeek response...');
  console.log('[API] 📄 Raw content (first 500 chars):', jsonString.substring(0, 500));
  
  let parsed: any;
  let parseAttempts = 0;
  const maxAttempts = 3;
  
  // Try parsing, with repair attempts
  while (parseAttempts < maxAttempts) {
    try {
      parsed = JSON.parse(jsonString);
      if (parseAttempts > 0) {
        console.log(`[API] ✅ JSON repaired after ${parseAttempts} attempt(s)`);
      }
      break;
    } catch (error: any) {
      parseAttempts++;
      if (parseAttempts >= maxAttempts) {
        console.error('[API] ❌ Failed to parse JSON after repair attempts');
        console.error('[API] 📄 Last attempt content:', jsonString.substring(0, 1000));
        throw new Error(`Failed to parse DeepSeek response: ${error.message}`);
      }
      
      console.log(`[API] 🔧 Attempting to repair JSON (attempt ${parseAttempts}/${maxAttempts})...`);
      console.log('[API] 📄 Error:', error.message.substring(0, 200));
      
      // Try to repair common JSON issues
      jsonString = repairJsonString(jsonString);
      
      // Also try to extract just the hashtags array and fix it
      const hashtagsMatch = jsonString.match(/"hashtags"\s*:\s*\[([^\]]+)\]/);
      if (hashtagsMatch) {
        const hashtagsContent = hashtagsMatch[1];
        // Fix unquoted hashtags
        const fixedHashtags = hashtagsContent
          .split(',')
          .map(tag => {
            const trimmed = tag.trim();
            if (trimmed.startsWith('#') && !trimmed.startsWith('"#')) {
              return `"${trimmed.replace(/"/g, '')}"`;
            }
            return trimmed;
          })
          .join(', ');
        jsonString = jsonString.replace(
          /"hashtags"\s*:\s*\[[^\]]+\]/,
          `"hashtags": [${fixedHashtags}]`
        );
      }
    }
  }
  
  // After successful parsing, process the data
  console.log('[API] ✅ JSON parsed successfully');
  console.log('[API] 📊 Parsed structure:', {
    hasCaptions: !!parsed.captions,
    hasHashtags: !!parsed.hashtags,
    hashtagsType: typeof parsed.hashtags,
    hashtagsIsArray: Array.isArray(parsed.hashtags),
  });
  
  const captions = {
    short: parsed.captions?.short || '',
    medium: parsed.captions?.medium || '',
    long: parsed.captions?.long || '',
  };
  
  // Validate captions are not empty
  if (!captions.short && !captions.medium && !captions.long) {
    console.error('[API] ❌ All captions are empty!');
    throw new Error('DeepSeek returned empty captions');
  }
  
  console.log('[API] 📝 Captions lengths:', {
    short: captions.short.length,
    medium: captions.medium.length,
    long: captions.long.length,
  });
  
  // Handle hashtags - can be array or string
  let hashtags: string[] = [];
  
  if (Array.isArray(parsed.hashtags)) {
    // Already an array, filter valid hashtags
    hashtags = parsed.hashtags
      .filter(tag => typeof tag === 'string' && tag.startsWith('#') && tag.length > 1)
      .slice(0, hashtagCount);
    console.log('[API] 📌 Hashtags from array:', hashtags.length);
  } else if (typeof parsed.hashtags === 'string') {
    // String format, parse it
    hashtags = parseHashtags(parsed.hashtags, hashtagCount);
    console.log('[API] 📌 Hashtags from string:', hashtags.length);
  } else {
    console.warn('[API] ⚠️  Hashtags field is neither array nor string:', typeof parsed.hashtags);
  }
  
  // Ensure we have the right count
  if (hashtags.length !== hashtagCount && hashtagCount > 0) {
    if (hashtags.length > hashtagCount) {
      hashtags = hashtags.slice(0, hashtagCount);
    } else if (hashtags.length < hashtagCount && hashtags.length > 0) {
      // Pad with variations if needed (but only if we have some hashtags)
      const baseTags = hashtags.slice();
      while (baseTags.length < hashtagCount && baseTags.length > 0) {
        const lastTag = baseTags[baseTags.length - 1];
        const variation = `${lastTag}${baseTags.length}`;
        if (!baseTags.includes(variation)) {
          baseTags.push(variation);
        } else {
          break;
        }
      }
      hashtags = baseTags.slice(0, hashtagCount);
    }
  }
  
  console.log('[API] ✅ Final parsed result:', {
    captions: { 
      short: captions.short.substring(0, 50) + '...',
      medium: captions.medium.substring(0, 50) + '...',
      long: captions.long.substring(0, 50) + '...',
    },
    hashtagsCount: hashtags.length,
    hashtagsPreview: hashtags.slice(0, 5),
  });
  
  return { captions, hashtags };
}

/**
 * Call DeepSeek API
 */
async function callDeepSeekAPI(body: RequestBody): Promise<StandardApiResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  const fullBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const systemPrompt = buildSystemPrompt(body.language);
  const userPrompt = buildUserPrompt(
    body.topic,
    body.tone,
    body.length,
    body.hashtagCount,
    body.language
  );

  console.log('[API] 🤖 Calling DeepSeek API...');
  console.log('[API] 📋 Request details:', {
    topic: body.topic.substring(0, 50),
    language: body.language,
    tone: body.tone,
    hashtagCount: body.hashtagCount,
    model,
    baseUrl: fullBaseUrl,
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
  });

  const content = await callDeepSeek({
    systemPrompt,
    userPrompt,
    baseUrl: fullBaseUrl,
    apiKey,
    model,
  });

  const parsed = parseDeepSeekResponse(content, body.hashtagCount);

  return {
    ok: true,
    result: {
      captions: parsed.captions,
      hashtags: parsed.hashtags,
      language: body.language,
      tone: body.tone,
      length: body.length,
      hashtagCount: body.hashtagCount,
      topic: body.topic,
    },
    meta: {
      cache_hit: false,
      provider: 'deepseek',
      request_id: generateRequestId(),
    },
    _provider: 'deepseek',
    _cache: 'miss',
  };
}

/**
 * Generate fallback (template-based)
 */
async function generateFallback(body: RequestBody): Promise<StandardApiResponse> {
  try {
    // Map tone to template generator supported tones
    const toneMap: Record<string, 'friendly' | 'professional' | 'fun' | 'inspirational'> = {
      'friendly': 'friendly',
      'professional': 'professional',
      'fun': 'fun',
      'funny': 'fun',
      'humorous': 'fun',
      'casual': 'friendly',
      'conversational': 'friendly',
      'minimalist': 'friendly',
      'inspirational': 'inspirational',
      'authoritative': 'professional',
      'sarcastic': 'fun',
      'emotional': 'friendly',
      'storytelling': 'friendly',
      'creative': 'friendly',
      'engaging': 'friendly',
    };
    
    const templateTone = toneMap[body.tone] || 'friendly';
    
    // generateTemplates is synchronous
    const templateResult = generateTemplates(
      body.topic,
      body.language,
      templateTone,
      body.length,
      body.hashtagCount,
      body.type
    );

    // Combine hashtags into array
    const allHashtags = [
      ...(templateResult.hashtags.broad || []),
      ...(templateResult.hashtags.niche || []),
      ...(templateResult.hashtags.discovery || []),
    ].slice(0, body.hashtagCount);

    return {
      ok: true,
      result: {
        captions: templateResult.captions || {
          short: '',
          medium: '',
          long: '',
        },
        hashtags: allHashtags,
        language: body.language,
        tone: body.tone,
        length: body.length,
        hashtagCount: body.hashtagCount,
        topic: body.topic,
      },
      meta: {
        cache_hit: false,
        provider: 'fallback',
        request_id: generateRequestId(),
      },
      _provider: 'fallback',
      _cache: 'miss',
    };
  } catch (error) {
    console.error('[API] Fallback generator error:', error);
      // Last resort: return minimal valid structure
    return {
      ok: true,
      result: {
        captions: {
          short: `Exploring ${body.topic}!`,
          medium: `Discovering ${body.topic} and all it has to offer.`,
          long: `My experience with ${body.topic} has been remarkable. There's so much to explore and appreciate.`,
        },
        hashtags: body.hashtagCount > 0 ? [`#${body.topic.replace(/\s+/g, '')}`] : [],
        language: body.language,
        tone: body.tone,
        length: body.length,
        hashtagCount: body.hashtagCount,
        topic: body.topic,
      },
      meta: {
        cache_hit: false,
        provider: 'fallback',
        request_id: generateRequestId(),
      },
      _provider: 'fallback',
      _cache: 'miss',
    };
  }
}

/**
 * Main handler
 */
export async function handleGenerate(req: Request, res: Response) {
  const requestId = generateRequestId();
  const clientIP = getClientIP(req);

  try {
    // Check rate limit
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        ok: false,
        error: {
          message: 'Too many requests. Please try again later.',
          code: 'rate_limited',
        },
        meta: {
          cache_hit: false,
          provider: 'none',
          request_id: requestId,
        },
        _provider: 'none',
        _cache: 'miss',
      });
    }

    // Validate request
    const validationResult = requestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        ok: false,
        error: {
          message: 'Invalid request parameters',
          code: 'VALIDATION_ERROR',
        },
        meta: {
          cache_hit: false,
          provider: 'none',
          request_id: requestId,
        },
      });
    }

    const body = validationResult.data;

    // Check cache
    const cacheKey = generateCacheKey(body);
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log(`[API] CACHE HIT ${cacheKey.substring(0, 8)}`);
      return res.json({
        ...cached,
        meta: {
          ...cached.meta,
          cache_hit: true,
        },
        _provider: cached.meta.provider,
        _cache: 'hit',
      });
    }

    console.log(`[API] CACHE MISS ${cacheKey.substring(0, 8)}`);

    // Try DeepSeek first
    const hasApiKey = !!process.env.DEEPSEEK_API_KEY?.trim();
    let result: StandardApiResponse;

    try {
      if (hasApiKey) {
        console.log('[API] ✅ DeepSeek API key found, calling DeepSeek...');
        result = await callDeepSeekAPI(body);
        result.meta.request_id = requestId;
        result._provider = 'deepseek';
        result._cache = 'miss';
        // Cache successful result
        cache.set(cacheKey, result);
        console.log('[API] ✅ DeepSeek call successful, cached');
      } else {
        console.log('[API] ⚠️  DeepSeek API key NOT configured, using fallback');
        throw new Error('DEEPSEEK_API_KEY not configured');
      }
    } catch (deepSeekError: any) {
      console.error('[API] ❌ DeepSeek error:', deepSeekError.message || deepSeekError);
      console.log('[API] 🔄 Falling back to template generator...');
      // Fallback to template generator
      result = await generateFallback(body);
      result.meta.request_id = requestId;
      result._provider = 'fallback';
      result._cache = 'miss';
      // Don't cache fallback results
      console.log('[API] ✅ Fallback generation complete');
    }

    res.json(result);
  } catch (error: any) {
    console.error('[API] Handler error:', error);
    res.status(500).json({
      ok: false,
      error: {
        message: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      meta: {
        cache_hit: false,
        provider: 'none',
        request_id: requestId,
      },
    });
  }
}
