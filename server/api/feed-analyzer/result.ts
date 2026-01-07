/**
 * GET /api/feed-analyzer/result/:jobId
 * Get job result
 */

import { Request, Response } from 'express';
import { getJob } from '../lib/jobStore.js';

export const handleGetResult = async (req: Request, res: Response) => {
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
    
    if (job.status === 'failed') {
      return res.status(500).json({
        ok: false,
        error: job.error || {
          code: 'ANALYSIS_FAILED',
          message: 'Analysis failed',
        },
      });
    }
    
    if (job.status !== 'done') {
      return res.status(400).json({
        ok: false,
        error: {
          code: 'JOB_NOT_READY',
          message: `Job is not ready (status: ${job.status})`,
        },
      });
    }
    
    if (!job.result) {
      return res.status(500).json({
        ok: false,
        error: {
          code: 'NO_RESULT',
          message: 'Job completed but no result available',
        },
      });
    }
    
    res.json({
      ok: true,
      result: job.result,
    });
  } catch (error: any) {
    console.error('[Feed Analyzer Result] Error:', error);
    res.status(500).json({
      ok: false,
      error: {
        code: 'RESULT_ERROR',
        message: error.message || 'Failed to get result',
      },
    });
  }
};


