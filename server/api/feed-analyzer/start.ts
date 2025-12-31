/**
 * POST /api/feed-analyzer/start
 * Start async feed analysis job
 */

import { Request, Response } from 'express';
import multer from 'multer';
import { createJob } from '../lib/jobStore.js';
import { analyzeFeedAsync } from '../lib/feedAnalysisAsync.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const uploadMiddleware = upload.fields(
  Array.from({ length: 15 }, (_, i) => ({ name: `image${i}`, maxCount: 1 }))
);

export const handleStartAnalysis = async (req: Request, res: Response) => {
  try {
    console.log('[Feed Analyzer Start] Request received');
    
    // Get image files from request
    const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    const files: Express.Multer.File[] = [];
    if (filesObj) {
      Object.values(filesObj).forEach(fileArray => {
        if (Array.isArray(fileArray)) {
          files.push(...fileArray);
        } else if (fileArray) {
          files.push(fileArray);
        }
      });
    }
    
    console.log(`[Feed Analyzer Start] Received ${files.length} files`);
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'NO_IMAGES',
          message: 'No images provided',
        },
      });
    }

    const imageCount = parseInt(req.body.imageCount || '0', 10);
    const validCounts = [9, 12, 15];
    
    if (!validCounts.includes(imageCount)) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_COUNT',
          message: `Must provide exactly 9, 12, or 15 images. Received ${files.length}.`,
        },
      });
    }
    
    if (files.length !== imageCount) {
      console.warn(`[Feed Analyzer Start] Count mismatch: body says ${imageCount}, but received ${files.length} files`);
    }

    const contentType = req.body.contentType || undefined;
    const desiredVibe = req.body.desiredVibe || undefined;
    const language = (req.body.language || 'EN') as 'EN' | 'FR' | 'PT-BR' | 'ES';

    // Create job
    const jobId = createJob({
      imageCount,
      language,
      contentType,
      desiredVibe,
    });
    
    console.log(`[Feed Analyzer Start] Created job ${jobId} for ${imageCount} images`);

    // Start analysis in background (non-blocking)
    analyzeFeedAsync({
      images: files.map(f => ({ buffer: f.buffer, mimetype: f.mimetype })),
      imageCount,
      contentType,
      desiredVibe,
      language,
      jobId,
    }).catch((error: any) => {
      console.error(`[Feed Analyzer Start] Background job ${jobId} failed:`, error);
      // Error handling is done in analyzeFeedAsync
    });

    // Return job ID immediately
    res.json({
      ok: true,
      jobId,
    });
  } catch (error: any) {
    console.error('[Feed Analyzer Start] Error:', error);
    res.status(500).json({
      ok: false,
      error: {
        code: 'START_ERROR',
        message: error.message || 'Failed to start analysis',
      },
    });
  }
};

