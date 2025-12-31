/**
 * In-Memory Rate Limiter (Free-only, no Redis/Upstash)
 * 
 * Implements fixed-window rate limiting for API routes.
 * Fail-open: if limiter fails, allows request and logs error.
 */

interface RateLimitConfig {
  limit: number;        // Max requests per window
  windowMs: number;     // Window duration in milliseconds
  routeKey: string;    // Route identifier (e.g., 'captions', 'feed-analyzer')
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetMs: number;      // Timestamp when limit resets
  retryAfterSec: number; // Seconds until retry allowed
}

interface RateLimitHeaders {
  'X-RateLimit-Limit': string;
  'X-RateLimit-Remaining': string;
  'X-RateLimit-Reset': string;
  'Retry-After'?: string;
}

// In-memory store: Map<key, { count: number, windowStart: number }>
const store = new Map<string, { count: number; windowStart: number }>();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupInterval: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, value] of store.entries()) {
      // Delete entries older than 2 windows (safety margin)
      const maxAge = value.windowStart + (2 * 24 * 60 * 60 * 1000); // 2 days
      if (now > maxAge) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => store.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`[RateLimit] Cleaned up ${keysToDelete.length} old entries`);
    }
  }, CLEANUP_INTERVAL_MS);
}

// Start cleanup on first use
startCleanup();

/**
 * Get client identifier from request
 * Uses IP (with x-forwarded-for support) + user-agent hash as fallback
 */
export function getClientId(req: any): string {
  try {
    // Try x-forwarded-for (first IP if multiple)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const firstIp = forwardedFor.split(',')[0].trim();
      if (firstIp) {
        return `ip:${firstIp}`;
      }
    }
    
    // Try req.ip (Express sets this)
    if (req.ip) {
      return `ip:${req.ip}`;
    }
    
    // Try connection remoteAddress
    if (req.connection?.remoteAddress) {
      return `ip:${req.connection.remoteAddress}`;
    }
    
    // Fallback: hash user-agent
    const userAgent = req.headers['user-agent'] || 'unknown';
    // Simple hash (not crypto-secure, but good enough for rate limiting)
    let hash = 0;
    for (let i = 0; i < userAgent.length; i++) {
      const char = userAgent.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `ua:${Math.abs(hash)}`;
  } catch (error) {
    console.error('[RateLimit] Error getting client ID:', error);
    return 'anonymous';
  }
}

/**
 * Check rate limit for a request
 * Returns result and headers
 */
export function checkRateLimit(
  config: RateLimitConfig,
  clientId: string,
  dryRun: boolean = false
): { result: RateLimitResult; headers: RateLimitHeaders } {
  try {
    const now = Date.now();
    const windowMs = config.windowMs;
    const windowStart = Math.floor(now / windowMs) * windowMs;
    const key = `${config.routeKey}:${clientId}:${windowStart}`;
    
    // Get or create entry
    let entry = store.get(key);
    if (!entry || entry.windowStart !== windowStart) {
      // New window or expired entry
      entry = { count: 0, windowStart };
      store.set(key, entry);
    }
    
    // Increment count
    entry.count++;
    
    const limit = config.limit;
    const count = entry.count;
    const allowed = dryRun ? true : count <= limit;
    const remaining = Math.max(0, limit - count);
    const resetMs = windowStart + windowMs;
    const retryAfterSec = allowed ? 0 : Math.ceil((resetMs - now) / 1000);
    
    const result: RateLimitResult = {
      allowed,
      limit,
      remaining,
      resetMs,
      retryAfterSec,
    };
    
    // Build headers
    const headers: RateLimitHeaders = {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': Math.floor(resetMs / 1000).toString(), // Epoch seconds
    };
    
    if (!allowed) {
      headers['Retry-After'] = retryAfterSec.toString();
    }
    
    return { result, headers };
  } catch (error) {
    // Fail-open: allow request on error
    console.error('[RateLimit] Error checking limit:', error);
    
    const fallbackResult: RateLimitResult = {
      allowed: true, // Fail-open
      limit: config.limit,
      remaining: config.limit,
      resetMs: Date.now() + config.windowMs,
      retryAfterSec: 0,
    };
    
    const fallbackHeaders: RateLimitHeaders = {
      'X-RateLimit-Limit': config.limit.toString(),
      'X-RateLimit-Remaining': config.limit.toString(),
      'X-RateLimit-Reset': Math.floor((Date.now() + config.windowMs) / 1000).toString(),
    };
    
    return { result: fallbackResult, headers: fallbackHeaders };
  }
}

/**
 * Get rate limit configuration from environment or defaults
 */
export function getRateLimitConfig(routeKey: string): RateLimitConfig {
  const envKey = routeKey.toUpperCase().replace(/-/g, '_');
  const limitEnv = process.env[`RATE_LIMIT_${envKey}_PER_DAY`];
  const limit = limitEnv ? parseInt(limitEnv, 10) : getDefaultLimit(routeKey);
  
  // Window is always 24 hours
  const windowMs = 24 * 60 * 60 * 1000;
  
  return {
    limit: Math.max(1, limit), // At least 1
    windowMs,
    routeKey,
  };
}

function getDefaultLimit(routeKey: string): number {
  switch (routeKey) {
    case 'captions':
    case 'ig-generate':
      return 10; // 10 requests per day
    case 'feed-analyzer':
      return 3;  // 3 requests per day
    default:
      return 10; // Safe default
  }
}

/**
 * Check if dry-run mode is enabled
 */
export function isDryRun(): boolean {
  return process.env.RATE_LIMIT_DRY_RUN === 'true';
}

