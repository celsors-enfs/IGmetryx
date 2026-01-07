/**
 * In-memory job store for async feed analysis
 * Auto-cleans old jobs after TTL
 */

export type JobStatus = 'queued' | 'processing' | 'done' | 'failed';

export interface Job {
  jobId: string;
  status: JobStatus;
  progress: number; // 0-100
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: any;
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata?: {
    imageCount: number;
    language: string;
    contentType?: string;
    desiredVibe?: string;
  };
}

const jobs = new Map<string, Job>();
const JOB_TTL = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Generate unique job ID
export function generateJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Create a new job
export function createJob(metadata?: Job['metadata']): string {
  const jobId = generateJobId();
  const now = Date.now();
  
  jobs.set(jobId, {
    jobId,
    status: 'queued',
    progress: 0,
    createdAt: now,
    updatedAt: now,
    metadata,
  });
  
  console.log(`[Job Store] Created job ${jobId}`);
  return jobId;
}

// Get job by ID
export function getJob(jobId: string): Job | undefined {
  return jobs.get(jobId);
}

// Update job status
export function updateJobStatus(jobId: string, status: JobStatus, progress?: number): boolean {
  const job = jobs.get(jobId);
  if (!job) {
    console.warn(`[Job Store] Job ${jobId} not found`);
    return false;
  }
  
  job.status = status;
  job.updatedAt = Date.now();
  
  if (progress !== undefined) {
    job.progress = Math.max(0, Math.min(100, progress));
  }
  
  if (status === 'processing' && !job.startedAt) {
    job.startedAt = Date.now();
  }
  
  if (status === 'done' || status === 'failed') {
    job.completedAt = Date.now();
  }
  
  console.log(`[Job Store] Updated job ${jobId}: ${status} (${job.progress}%)`);
  return true;
}

// Set job result
export function setJobResult(jobId: string, result: any): boolean {
  const job = jobs.get(jobId);
  if (!job) {
    return false;
  }
  
  job.result = result;
  job.status = 'done';
  job.progress = 100;
  job.completedAt = Date.now();
  job.updatedAt = Date.now();
  
  console.log(`[Job Store] Set result for job ${jobId}`);
  return true;
}

// Set job error
export function setJobError(jobId: string, error: Job['error']): boolean {
  const job = jobs.get(jobId);
  if (!job) {
    return false;
  }
  
  job.error = error;
  job.status = 'failed';
  job.completedAt = Date.now();
  job.updatedAt = Date.now();
  
  console.log(`[Job Store] Set error for job ${jobId}: ${error?.code} - ${error?.message}`);
  return true;
}

// Clean up old jobs
function cleanupOldJobs() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [jobId, job] of jobs.entries()) {
    const age = now - job.updatedAt;
    if (age > JOB_TTL) {
      jobs.delete(jobId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Job Store] Cleaned up ${cleaned} old jobs`);
  }
}

// Start cleanup interval
setInterval(cleanupOldJobs, CLEANUP_INTERVAL);

// Get job statistics (for debugging)
export function getJobStats() {
  const stats = {
    total: jobs.size,
    queued: 0,
    processing: 0,
    done: 0,
    failed: 0,
  };
  
  for (const job of jobs.values()) {
    stats[job.status]++;
  }
  
  return stats;
}


