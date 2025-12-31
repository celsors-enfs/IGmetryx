/**
 * API Client for Caption & Hashtag Generation
 */

// Use relative path so Vite proxy works
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface CaptionHashtagRequest {
  type?: 'captions' | 'hashtags' | 'both';
  language: 'pt-BR' | 'en' | 'es' | 'fr';
  tone?: 'friendly' | 'professional' | 'fun' | 'funny' | 'minimalist' | 'inspirational' | 'casual' | 'conversational' | 'humorous' | 'authoritative' | 'sarcastic' | 'emotional' | 'storytelling' | 'creative' | 'engaging';
  length?: 'short' | 'medium' | 'long';
  hashtagCount?: number;
  topic: string;
}

export interface CaptionHashtagResponse {
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
    provider: 'deepseek' | 'fallback' | 'none';
    request_id: string;
  };
  error?: {
    message: string;
    code?: string;
    retryAfterSec?: number;
    resetAt?: string;
  };
}

/**
 * Generate captions and hashtags via API
 */
export async function generateCaptionsHashtags(
  request: CaptionHashtagRequest
): Promise<CaptionHashtagResponse> {
  try {
    const url = API_BASE_URL ? `${API_BASE_URL}/api/ig/generate` : '/api/ig/generate';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: request.type || 'both',
        language: request.language,
        tone: request.tone || 'friendly',
        length: request.length || 'medium',
        hashtagCount: request.hashtagCount || 15,
        topic: request.topic,
      }),
    });

    // Handle network errors
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      
      // Handle rate limiting
      if (response.status === 429) {
        const retryAfterSec = errorData.retryAfterSec || errorData.error?.retryAfterSec || 0;
        const resetAt = errorData.resetAt || errorData.error?.resetAt;
        return {
          ok: false,
          meta: {
            cache_hit: false,
            provider: 'none',
            request_id: '',
          },
          error: {
            message: errorData.message || errorData.error?.message || 'Too many requests. Please try again later.',
            code: errorData.code || errorData.error?.code || 'RATE_LIMITED',
            retryAfterSec,
            resetAt,
          },
        };
      }
      
      // Return standardized error response
      return {
        ok: false,
        meta: {
          cache_hit: false,
          provider: 'none',
          request_id: '',
        },
        error: {
          message: errorData.message || errorData.error?.message || 'Failed to generate content',
          code: errorData.code || errorData.error?.code || 'HTTP_ERROR',
        },
      };
    }

    const data = await response.json() as CaptionHashtagResponse;

    // Validate response structure
    if (data.ok === undefined || !data.meta) {
      return {
        ok: false,
        meta: {
          cache_hit: false,
          provider: 'none',
          request_id: '',
        },
        error: {
          message: 'Invalid response from server',
          code: 'INVALID_RESPONSE',
        },
      };
    }

    return data;
  } catch (error: any) {
    // Network errors, fetch failures, etc.
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        ok: false,
        meta: {
          cache_hit: false,
          provider: 'none',
          request_id: '',
        },
        error: {
          message: 'Network error. Please check if the API server is running.',
          code: 'NETWORK_ERROR',
        },
      };
    }
    
    return {
      ok: false,
      meta: {
        cache_hit: false,
        provider: 'none',
        request_id: '',
      },
      error: {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
      },
    };
  }
}
