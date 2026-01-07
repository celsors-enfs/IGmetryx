/**
 * Express Middleware for Rate Limiting
 * 
 * Applies rate limiting to specific routes with fail-open behavior.
 */

import { Request, Response, NextFunction } from 'express';
import {
  checkRateLimit,
  getClientId,
  getRateLimitConfig,
  isDryRun,
} from './rateLimit.js';

/**
 * Create rate limit middleware for a specific route
 */
export function rateLimitMiddleware(routeKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = getRateLimitConfig(routeKey);
      const clientId = getClientId(req);
      const dryRun = isDryRun();
      
      const { result, headers } = checkRateLimit(config, clientId, dryRun);
      
      // Set headers always (for debugging)
      Object.entries(headers).forEach(([key, value]) => {
        res.setHeader(key, value);
      });
      
      // Log in dry-run mode
      if (dryRun) {
        console.log(`[RateLimit] DRY-RUN ${routeKey}: client=${clientId.substring(0, 20)}... allowed=${result.allowed} remaining=${result.remaining}`);
      }
      
      // Block if limit exceeded (unless dry-run)
      if (!result.allowed) {
        // Log blocked request
        console.log(`[RateLimit] BLOCKED ${routeKey}: client=${clientId.substring(0, 20)}... limit=${result.limit} resetAt=${new Date(result.resetMs).toISOString()}`);
        
        // Get language from request (body, query, or header)
        const language = getLanguageFromRequest(req);
        
        return res.status(429).json({
          ok: false,
          error: {
            code: 'RATE_LIMITED',
            message: getRateLimitMessage(language, result.retryAfterSec),
            retryAfterSec: result.retryAfterSec,
            resetAt: new Date(result.resetMs).toISOString(),
          },
        });
      }
      
      // Allow request
      next();
    } catch (error) {
      // Fail-open: allow request on error
      console.error('[RateLimit] Middleware error (fail-open):', error);
      next();
    }
  };
}

/**
 * Extract language from request
 */
function getLanguageFromRequest(req: Request): 'en' | 'es' | 'pt-BR' | 'fr' {
  // Try body first (most common)
  if (req.body?.language) {
    const lang = req.body.language.toLowerCase();
    if (lang === 'pt-br' || lang === 'pt_br') return 'pt-BR';
    if (lang === 'en') return 'en';
    if (lang === 'es') return 'es';
    if (lang === 'fr') return 'fr';
  }
  
  // Try query
  if (req.query?.language) {
    const lang = String(req.query.language).toLowerCase();
    if (lang === 'pt-br' || lang === 'pt_br') return 'pt-BR';
    if (lang === 'en') return 'en';
    if (lang === 'es') return 'es';
    if (lang === 'fr') return 'fr';
  }
  
  // Try Accept-Language header
  const acceptLang = req.headers['accept-language'];
  if (acceptLang) {
    if (acceptLang.includes('pt')) return 'pt-BR';
    if (acceptLang.includes('es')) return 'es';
    if (acceptLang.includes('fr')) return 'fr';
  }
  
  // Default to English
  return 'en';
}

/**
 * Get rate limit message based on language
 */
function getRateLimitMessage(language: 'en' | 'es' | 'pt-BR' | 'fr', retryAfterSec: number): string {
  const timeStr = formatTime(retryAfterSec);
  
  const messages: Record<string, string> = {
    'en': `You've used today's free limit for this tool. Try again in ${timeStr}.`,
    'es': `Has alcanzado el límite gratuito de hoy para esta herramienta. Inténtalo de nuevo en ${timeStr}.`,
    'pt-BR': `Você já usou o limite gratuito de hoje para esta ferramenta. Tente novamente em ${timeStr}.`,
    'fr': `Vous avez atteint la limite gratuite d'aujourd'hui pour cet outil. Réessayez dans ${timeStr}.`,
  };
  
  return messages[language] || messages['en'];
}

/**
 * Format seconds into human-readable time
 */
function formatTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}


