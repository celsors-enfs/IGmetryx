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
}

// Use proxy in development, direct URL in production
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (import.meta.env.DEV ? '' : 'http://localhost:3001');

export async function analyzeFeed(request: AnalyzeFeedRequest): Promise<FeedAnalysisResult> {
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

  // Add timeout to fetch request (45 seconds - slightly longer than server timeout of 40s)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000);

  try {
    // Use relative URL to leverage Vite proxy in development
    const apiUrl = `${API_BASE_URL}/api/feed/analyze`;
    console.log('[Feed Analyzer] Making request to:', apiUrl);
    
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
      
      // Extract error message from response
      const errorMessage = errorData.error?.message || errorData.message || `HTTP ${response.status}: Analysis failed`;
      console.error('[Feed Analyzer] API error response:', errorData);
      
      // Create a more descriptive error
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).code = errorData.error?.code || 'API_ERROR';
      throw error;
    }

    const data = await response.json();
    
    if (!data.result) {
      throw new Error('Invalid response from server');
    }
    
    return data.result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    // Handle abort (timeout)
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      throw new Error('Request timeout. The analysis is taking too long. Please try again with fewer images.');
    }
    
    // Handle network errors - check multiple conditions
    const isNetworkError = 
      error.name === 'TypeError' ||
      error.name === 'NetworkError' ||
      error.message?.includes('fetch') ||
      error.message?.includes('Failed to fetch') ||
      error.message?.includes('Network request failed') ||
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.message?.includes('ERR_NETWORK') ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND';
    
    if (isNetworkError) {
      throw new Error('NETWORK_ERROR');
    }
    
    throw error;
  }
}

