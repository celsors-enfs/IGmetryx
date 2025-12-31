import { Request, Response } from 'express';
import multer from 'multer';
import { analyzeFeedImages } from '../lib/feedAnalysis.js';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export const handleAnalyzeFeed = async (req: Request, res: Response) => {
  try {
    console.log('[Feed Analyzer] Request received');
    console.log('[Feed Analyzer] Request body keys:', Object.keys(req.body || {}));
    console.log('[Feed Analyzer] Request files:', req.files ? Object.keys(req.files as object) : 'none');
    
    // Get image files from request (multer.fields returns an object)
    const filesObj = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    
    // Extract all files from the fields object
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
    
    console.log(`[Feed Analyzer] Received ${files.length} files`);
    
    if (!files || files.length === 0) {
      console.error('[Feed Analyzer] No files received');
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
    
    console.log(`[Feed Analyzer] Image count from body: ${imageCount}, files received: ${files.length}`);
    
    if (!validCounts.includes(imageCount)) {
      console.error(`[Feed Analyzer] Invalid image count: ${imageCount}`);
      return res.status(400).json({
        ok: false,
        error: {
          code: 'INVALID_COUNT',
          message: `Must provide exactly 9, 12, or 15 images. Received ${files.length}.`,
        },
      });
    }
    
    if (files.length !== imageCount) {
      console.warn(`[Feed Analyzer] Count mismatch: body says ${imageCount}, but received ${files.length} files`);
    }

    const contentType = req.body.contentType || undefined;
    const desiredVibe = req.body.desiredVibe || undefined;
    const language = (req.body.language || 'EN') as 'EN' | 'FR' | 'PT-BR' | 'ES';

    console.log(`[Feed Analyzer] Starting analysis for ${imageCount} images (language: ${language}, contentType: ${contentType}, vibe: ${desiredVibe})`);

    // Analyze feed with error handling
    let result;
    try {
      result = await analyzeFeedImages({
        images: files,
        imageCount,
        contentType,
        desiredVibe,
        language,
      });
      console.log('[Feed Analyzer] Analysis completed successfully');
    } catch (analysisError: any) {
      console.error('[Feed Analyzer] Error in analyzeFeedImages:', analysisError);
      console.error('[Feed Analyzer] Analysis error stack:', analysisError?.stack);
      throw analysisError; // Re-throw to be caught by outer catch
    }

    res.json({
      ok: true,
      result,
    });
  } catch (error: any) {
    console.error('[Feed Analyzer] Top-level error:', error);
    console.error('[Feed Analyzer] Error name:', error?.name);
    console.error('[Feed Analyzer] Error message:', error?.message);
    console.error('[Feed Analyzer] Error stack:', error?.stack);
    
    // Provide more detailed error information
    const errorMessage = error?.message || 'Failed to analyze feed';
    const errorCode = error?.code || 'ANALYSIS_ERROR';
    
    res.status(500).json({
      ok: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      },
    });
  }
};

// Export multer middleware for use in routes
// Note: multer expects field names like 'image0', 'image1', etc. from frontend
export const uploadMiddleware = upload.fields(
  Array.from({ length: 15 }, (_, i) => ({ name: `image${i}`, maxCount: 1 }))
);

