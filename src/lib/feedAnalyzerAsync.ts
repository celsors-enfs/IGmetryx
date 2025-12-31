/**
 * Async Feed Analyzer API Client
 * Uses job-based polling instead of synchronous requests
 */

interface AnalyzeFeedRequest {
  images: File[];
  imageCount: number;
  contentType?: string;
  desiredVibe?: string;
  language: 'EN' | 'FR' | 'PT-BR' | 'ES';
}

interface FeedAnalysisResult {
  score: number;
  scoreLabel: string;
  breakdown: {
    colorBalance: { score: number; explanation: string };
    visualRhythm: { score: number; explanation: string };
    contrastReadability: { score: number; explanation: string };
    contentVariety: { score: number; explanation: string };
    overallConsistency: { score: number; explanation: string };
  };
  insights: string[];
  recommendations: string[];
  nextPostGuidance: string;
  isBasicAnalysis?: boolean;
}

interface JobStatus {
  status: 'queued' | 'processing' | 'done' | 'failed';
  progress: number;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '' : 'http://localhost:3001');

const POLL_INTERVAL = 1000; // Start with 1 second
const MAX_POLL_INTERVAL = 2000; // Max 2 seconds
const POLL_BACKOFF_AFTER = 10; // Backoff after 10 polls
const MAX_POLL_ATTEMPTS = 120; // Max 2 minutes of polling

/**
 * Start analysis job
 */
export async function startAnalysis(request: AnalyzeFeedRequest, signal?: AbortSignal): Promise<string> {
  const formData = new FormData();
  
  request.images.forEach((image, index) => {
    formData.append(`image${index}`, image);
  });
  
  formData.append('imageCount', request.imageCount.toString());
  if (request.contentType) {
    formData.append('contentType', request.contentType);
  }
  if (request.desiredVibe) {
    formData.append('desiredVibe', request.desiredVibe);
  }
  formData.append('language', request.language);

  const apiUrl = `${API_BASE_URL}/api/feed-analyzer/start`;
  console.log('[Feed Analyzer Async] Starting analysis job...', {
    language: request.language,
    contentType: request.contentType,
    desiredVibe: request.desiredVibe,
    imageCount: request.imageCount,
  });
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
  
  // Combine signals if provided
  if (signal) {
    signal.addEventListener('abort', () => controller.abort());
  }
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText || `HTTP ${response.status}` };
      }
      
      const error = new Error(errorData.error?.message || errorData.message || 'Failed to start analysis');
      (error as any).status = response.status;
      (error as any).code = errorData.error?.code || 'START_ERROR';
      (error as any).retryAfterSec = errorData.error?.retryAfterSec;
      (error as any).resetAt = errorData.error?.resetAt;
      throw error;
    }

    const data = await response.json();
    
    if (!data.jobId) {
      throw new Error('Invalid response from server: missing jobId');
    }
    
    console.log('[Feed Analyzer Async] Job started:', data.jobId);
    return data.jobId;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError: any = new Error('Request timeout after 60 seconds');
      timeoutError.code = 'TIMEOUT';
      throw timeoutError;
    }
    throw err;
  }
}

/**
 * Get job status
 */
export async function getJobStatus(jobId: string): Promise<JobStatus> {
  const apiUrl = `${API_BASE_URL}/api/feed-analyzer/status/${jobId}`;
  
  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || `HTTP ${response.status}` };
    }
    
    const error = new Error(errorData.error?.message || errorData.message || 'Failed to get status');
    (error as any).status = response.status;
    (error as any).code = errorData.error?.code || 'STATUS_ERROR';
    throw error;
  }

  const data = await response.json();
  return {
    status: data.status,
    progress: data.progress || 0,
  };
}

/**
 * Get job result
 */
export async function getJobResult(jobId: string): Promise<FeedAnalysisResult> {
  const apiUrl = `${API_BASE_URL}/api/feed-analyzer/result/${jobId}`;
  
  const response = await fetch(apiUrl);

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: any;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || `HTTP ${response.status}` };
    }
    
    const error = new Error(errorData.error?.message || errorData.message || 'Failed to get result');
    (error as any).status = response.status;
    (error as any).code = errorData.error?.code || 'RESULT_ERROR';
    throw error;
  }

  const data = await response.json();
  
  if (!data.result) {
    throw new Error('Invalid response from server: missing result');
  }
  
  return data.result;
}

/**
 * Poll for job completion with progress updates
 */
export async function pollForResult(
  jobId: string,
  onProgress?: (progress: number, status: string) => void
): Promise<FeedAnalysisResult> {
  let pollCount = 0;
  let currentInterval = POLL_INTERVAL;
  
  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        pollCount++;
        
        // Check max attempts
        if (pollCount > MAX_POLL_ATTEMPTS) {
          reject(new Error('POLL_TIMEOUT'));
          return;
        }
        
        const status = await getJobStatus(jobId);
        
        // Update progress callback
        if (onProgress) {
          onProgress(status.progress, status.status);
        }
        
        if (status.status === 'done') {
          // Get result
          const result = await getJobResult(jobId);
          resolve(result);
          return;
        }
        
        if (status.status === 'failed') {
          // Get error from result endpoint
          try {
            await getJobResult(jobId);
          } catch (error: any) {
            reject(error);
            return;
          }
          reject(new Error('Analysis failed'));
          return;
        }
        
        // Backoff after initial polls
        if (pollCount > POLL_BACKOFF_AFTER) {
          currentInterval = Math.min(MAX_POLL_INTERVAL, currentInterval * 1.1);
        }
        
        // Continue polling
        setTimeout(poll, currentInterval);
      } catch (error: any) {
        // Network errors - retry a few times
        if (error.message?.includes('fetch') || error.message?.includes('Failed to fetch')) {
          if (pollCount < 5) {
            setTimeout(poll, currentInterval);
            return;
          }
        }
        reject(error);
      }
    };
    
    // Start polling
    poll();
  });
}

