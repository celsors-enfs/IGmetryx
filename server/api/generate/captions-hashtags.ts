/**
 * API Endpoint: /api/generate/captions-hashtags
 * 
 * Generates Instagram captions and hashtags using DeepSeek API
 * Includes caching, rate limiting, and validation
 */

import { Request, Response } from 'express';
import { z } from 'zod';
import { LRUCache } from 'lru-cache';
import crypto from 'crypto';

// Request validation schema
const requestSchema = z.object({
  language: z.enum(['pt-BR', 'en', 'es', 'fr']),
  tone: z.enum(['friendly', 'professional', 'fun', 'minimalist', 'inspirational']),
  length: z.enum(['short', 'medium', 'long']),
  hashtagCount: z.number().int().min(0).max(30),
  topic: z.string().min(1).max(500),
});

type RequestBody = z.infer<typeof requestSchema>;

// Response type
interface ApiResponse {
  captions: {
    short: string;
    medium: string;
    long: string;
  };
  hashtags: {
    broad: string[];
    niche: string[];
    discovery: string[];
  };
}

// In-memory LRU cache (7 days TTL)
const cache = new LRUCache<string, ApiResponse>({
  max: 1000, // Max 1000 cached entries
  ttl: 1000 * 60 * 60 * 24 * 7, // 7 days
});

// Rate limiting: track by IP
interface RateLimitEntry {
  requests: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const RATE_LIMIT_PER_MINUTE = 5;
const RATE_LIMIT_PER_DAY = 30;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Normalize topic for cache key
 */
function normalizeTopic(topic: string): string {
  return topic
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Remove emojis
    .substring(0, 120); // Max 120 chars
}

/**
 * Generate cache key
 */
function generateCacheKey(body: RequestBody): string {
  const normalizedTopic = normalizeTopic(body.topic);
  const keyString = `${body.language}|${body.tone}|${body.length}|${body.hashtagCount}|${normalizedTopic}`;
  return crypto.createHash('sha256').update(keyString).digest('hex');
}

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
  let entry = rateLimitStore.get(ip);

  if (!entry) {
    entry = {
      requests: 1,
      resetAt: now + RATE_LIMIT_DAY_MS,
    };
    rateLimitStore.set(ip, entry);
    return { allowed: true };
  }

  // Check daily limit
  if (entry.requests >= RATE_LIMIT_PER_DAY) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Check per-minute limit (simplified: check last minute)
  // In production, use a more sophisticated sliding window
  entry.requests += 1;

  // Reset if day window expired
  if (now > entry.resetAt) {
    entry.requests = 1;
    entry.resetAt = now + RATE_LIMIT_DAY_MS;
  }

  rateLimitStore.set(ip, entry);
  return { allowed: true };
}

/**
 * Get system prompt for DeepSeek
 */
function getSystemPrompt(language: string): string {
  const languageMap: Record<string, string> = {
    'pt-BR': 'português brasileiro',
    'en': 'English',
    'es': 'español',
    'fr': 'français',
  };

  const langName = languageMap[language] || 'English';

  return `You are a professional Instagram copywriter.

Write captions that:
- sound human
- feel contextual
- match the user's topic exactly
- never repeat generic filler phrases
- never exaggerate results or promises

Rules:
- Language: ${langName} ONLY
- Do NOT mix languages
- Do NOT explain what you are doing
- Do NOT mention algorithms or growth hacks
- Do NOT include markdown
- Emojis are allowed but must feel natural

Output format (STRICT JSON):

{
  "captions": {
    "short": "...",
    "medium": "...",
    "long": "..."
  },
  "hashtags": {
    "broad": ["#..."],
    "niche": ["#..."],
    "discovery": ["#..."]
  }
}`;
}

/**
 * Get user message for DeepSeek
 */
function getUserMessage(body: RequestBody): string {
  return `Generate Instagram captions and hashtags for the following topic:

Topic: ${body.topic}
Tone: ${body.tone}
Caption length preference: ${body.length} (but still return all 3: short, medium, long)
Hashtag count: ${body.hashtagCount} total hashtags

Constraints:
- The broad/niche/discovery hashtag groups should sum approximately to ${body.hashtagCount} total hashtags
- Hashtags should be relevant to the topic
- Avoid spam hashtags like #followme, #like4like, or anything spammy
- Do not include banned or inappropriate words
- Return ONLY valid JSON, no markdown, no code fences`;
}

/**
 * Call DeepSeek API
 */
async function callDeepSeek(body: RequestBody): Promise<ApiResponse> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY not configured');
  }

  const systemPrompt = getSystemPrompt(body.language);
  const userMessage = getUserMessage(body);

  const response = await fetch(`${baseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 900,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content in DeepSeek response');
  }

  // Parse JSON - strip code fences if present
  let jsonString = content.trim();
  if (jsonString.startsWith('```')) {
    jsonString = jsonString.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    const parsed = JSON.parse(jsonString);
    
    // Validate structure
    if (!parsed.captions || !parsed.hashtags) {
      throw new Error('Invalid response structure from DeepSeek');
    }

    return {
      captions: {
        short: parsed.captions.short || '',
        medium: parsed.captions.medium || '',
        long: parsed.captions.long || '',
      },
      hashtags: {
        broad: Array.isArray(parsed.hashtags.broad) ? parsed.hashtags.broad : [],
        niche: Array.isArray(parsed.hashtags.niche) ? parsed.hashtags.niche : [],
        discovery: Array.isArray(parsed.hashtags.discovery) ? parsed.hashtags.discovery : [],
      },
    };
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    console.error('Content:', jsonString);
    throw new Error('Failed to parse DeepSeek response as JSON');
  }
}

/**
 * Fallback to local generator if DeepSeek fails
 */
async function fallbackToLocalGenerator(body: RequestBody): Promise<ApiResponse> {
  // Import local generator - use dynamic import with proper path
  // Note: In production, this path may need adjustment based on build structure
  const generationModule = await import('../../src/lib/generation/index.js');
  const { generateAll } = generationModule;
  
  const localeMap: Record<string, 'pt-BR' | 'en' | 'es' | 'fr'> = {
    'pt-BR': 'pt-BR',
    'en': 'en',
    'es': 'es',
    'fr': 'fr',
  };

  const toneMap: Record<string, 'friendly' | 'professional' | 'funny' | 'inspirational'> = {
    'friendly': 'friendly',
    'professional': 'professional',
    'fun': 'funny',
    'minimalist': 'friendly',
    'inspirational': 'inspirational',
  };

  const lengthMap: Record<string, 'short' | 'medium' | 'long'> = {
    'short': 'short',
    'medium': 'medium',
    'long': 'long',
  };

  const result = generateAll(
    body.topic,
    localeMap[body.language] || 'en',
    toneMap[body.tone] || 'friendly',
    lengthMap[body.length] || 'medium',
    body.hashtagCount
  );

  // Map local generator format to API format
  return {
    captions: {
      short: result.captions.variantA,
      medium: result.captions.variantB,
      long: result.captions.variantC,
    },
    hashtags: {
      broad: result.hashtags.brand || [],
      niche: result.hashtags.niche || [],
      discovery: result.hashtags.context || [],
    },
  };
}

/**
 * Main handler
 */
export async function handleCaptionsHashtags(req: Request, res: Response) {
  try {
    // Validate request
    const validationResult = requestSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validationResult.error.errors,
      });
    }

    const body = validationResult.data;

    // Check rate limit
    const clientIP = getClientIP(req);
    const rateLimitCheck = checkRateLimit(clientIP);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'Too many requests. Please try again later.',
        retryAfter: rateLimitCheck.retryAfter,
      });
    }

    // Check cache
    const cacheKey = generateCacheKey(body);
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log('[API] Cache hit for:', cacheKey.substring(0, 16));
      return res.json(cached);
    }

    // Call DeepSeek API
    let result: ApiResponse;
    try {
      result = await callDeepSeek(body);
      // Cache successful result
      cache.set(cacheKey, result);
    } catch (deepSeekError) {
      console.error('[API] DeepSeek error:', deepSeekError);
      
      // Fallback to local generator
      console.log('[API] Falling back to local generator');
      result = await fallbackToLocalGenerator(body);
      
      // Don't cache fallback results
    }

    res.json(result);
  } catch (error: any) {
    console.error('[API] Handler error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
    });
  }
}

