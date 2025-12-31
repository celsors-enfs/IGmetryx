/**
 * GET /api/feed-analyzer/status/:jobId
 * Get job status
 */

import { Request, Response } from 'express';
import { getJob } from '../lib/jobStore.js';

export const handleGetStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    if (!jobId) {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'MISSING_JOB_ID',
          message: 'Job ID is required',
        },
      });
    }
    
    const job = getJob(jobId);
    
    if (!job) {
      return res.status(404).json({
        ok: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found',
        },
      });
    }
    
    res.json({
      ok: true,
      status: job.status,
      progress: job.progress,
    });
  } catch (error: any) {
    console.error('[Feed Analyzer Status] Error:', error);
    res.status(500).json({
      ok: false,
      error: {
        code: 'STATUS_ERROR',
        message: error.message || 'Failed to get status',
      },
    });
  }
};

