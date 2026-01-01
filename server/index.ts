/**
 * Express Server for IGmetryx API
 * 
 * Provides API endpoints for caption and hashtag generation
 */

// Load environment variables from .env.local
import dotenv from 'dotenv';
import path from 'path';

// Load .env.local explicitly
const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envLocalResult = dotenv.config({ path: envLocalPath });

if (envLocalResult.error) {
  // ENOENT means file doesn't exist, which is OK
  if (envLocalResult.error.message && !envLocalResult.error.message.includes('ENOENT')) {
    console.warn('[Server] Error loading .env.local:', envLocalResult.error.message);
  }
} else {
  console.log('[Server] ✅ Loaded .env.local');
}

// Also try .env as fallback
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import { handleGenerate } from './api/ig/generate.js';
import { handleAnalyzeFeed, uploadMiddleware as legacyUploadMiddleware } from './api/feed/analyze.js';
import { handleStartAnalysis, uploadMiddleware as feedAnalyzerUploadMiddleware } from './api/feed-analyzer/start.js';
import { handleGetStatus } from './api/feed-analyzer/status.js';
import { handleGetResult } from './api/feed-analyzer/result.js';
import { rateLimitMiddleware } from './api/lib/rateLimitMiddleware.js';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// Validate environment on startup
const hasDeepSeekKey = Boolean(process.env.DEEPSEEK_API_KEY?.trim());
const deepSeekBaseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const deepSeekModel = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

// Extract host from baseUrl for safe logging
let deepSeekHost = 'unknown';
try {
  const url = new URL(deepSeekBaseUrl);
  deepSeekHost = url.host;
} catch {
  deepSeekHost = deepSeekBaseUrl;
}

if (!hasDeepSeekKey) {
  console.warn('[Server] ⚠️  DEEPSEEK_API_KEY not configured. AI generation will use fallback mode.');
}

// Middleware - CORS with support for dev ports and Vercel
const allowedOrigins = [
  process.env.ALLOWED_ORIGIN,
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:3000',
  // Vercel preview and production domains
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
].filter((origin): origin is string => Boolean(origin));

// Allow any *.vercel.app domain for Vercel deployments
const isVercelDomain = (origin: string): boolean => {
  try {
    const url = new URL(origin);
    return url.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
};

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check Vercel domains
    if (isVercelDomain(origin)) {
      return callback(null, true);
    }
    
    // Reject others
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check - simplified for Render
app.get('/health', (req, res) => {
  res.json({ 
    ok: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Error handler for multer
const multerErrorHandler = (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    console.error('[Server] Multer error:', err);
    return res.status(400).json({
      ok: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message || 'File upload error',
      },
    });
  }
  if (err) {
    console.error('[Server] Upload error:', err);
    return res.status(400).json({
      ok: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message || 'File upload error',
      },
    });
  }
  next();
};

// API Routes
// Rate limiting applied only to AI routes (captions and feed analyzer)
app.post('/api/ig/generate', rateLimitMiddleware('ig-generate'), handleGenerate);
app.post('/api/feed/analyze', legacyUploadMiddleware, multerErrorHandler, handleAnalyzeFeed);

// New async feed analyzer endpoints
app.post('/api/feed-analyzer/start', rateLimitMiddleware('feed-analyzer'), feedAnalyzerUploadMiddleware, multerErrorHandler, handleStartAnalysis);
app.get('/api/feed-analyzer/status/:jobId', handleGetStatus);
app.get('/api/feed-analyzer/result/:jobId', handleGetResult);

// Legacy endpoint (for backward compatibility)
app.post('/api/generate/captions-hashtags', async (req: Request, res: Response) => {
  // Map old format to new format
  const newBody = {
    type: 'both' as const,
    language: req.body.language,
    tone: req.body.tone || 'friendly',
    length: req.body.length || 'medium',
    hashtagCount: req.body.hashtagCount || 15,
    topic: req.body.topic,
  };
  req.body = newBody;
  return handleGenerate(req, res);
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred',
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.path} not found`,
  });
});

// Start server - bind to 0.0.0.0 for Render compatibility
const HOST = '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`[Server] ✅ IGmetryx API server running on ${HOST}:${PORT}`);
  console.log(`[Server] 📡 Environment: ${process.env.NODE_ENV || 'development'}`);
  if (hasDeepSeekKey) {
    console.log(`[Server] 🤖 DeepSeek: ✅ configured (model=${deepSeekModel}, host=${deepSeekHost})`);
  } else {
    console.log(`[Server] 🤖 DeepSeek: ❌ not configured (using fallback)`);
  }
  console.log(`[Server] 🔗 API endpoint: http://${HOST}:${PORT}/api/ig/generate`);
  console.log(`[Server] 🏥 Health check: http://${HOST}:${PORT}/health`);
});

