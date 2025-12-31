/**
 * DeepSeek API Client
 * 
 * Robust client with retries, timeouts, and error handling
 */

interface DeepSeekRequest {
  model: string;
  messages: Array<{ role: 'system' | 'user'; content: string }>;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface DeepSeekError {
  error: {
    message: string;
    type?: string;
    code?: string;
  };
}

const DEFAULT_TIMEOUT_MS = 20000; // 20 seconds
const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = [429, 502, 503, 504];

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Exponential backoff with jitter
 */
function getRetryDelay(attempt: number): number {
  const baseDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
  const jitter = Math.random() * 1000; // 0-1s random
  return baseDelay + jitter;
}

/**
 * Call DeepSeek API with retries and timeout
 */
/**
 * Call DeepSeek API with retries and timeout
 */
export async function callDeepSeekAPI(
  request: DeepSeekRequest,
  apiKey: string,
  endpoint: string
): Promise<string> {
  // Ensure endpoint is a full URL
  const fullEndpoint = endpoint.startsWith('http') ? endpoint : `https://${endpoint}`;
  const timeoutMs = DEFAULT_TIMEOUT_MS;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(request),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: DeepSeekError | null = null;

        try {
          errorData = JSON.parse(errorText) as DeepSeekError;
        } catch {
          // Not JSON, use text
        }

        const errorMessage = errorData?.error?.message || errorText || `HTTP ${response.status}`;

        // Retry on retryable status codes
        if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          console.log(`[DeepSeek] Retryable error ${response.status}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }

        // Non-retryable error
        throw new Error(`DeepSeek API error (${response.status}): ${errorMessage}`);
      }

      const data = await response.json() as DeepSeekResponse;
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('No content in DeepSeek response');
      }

      return content;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // Don't retry on abort (timeout) or non-retryable errors
      if (error.name === 'AbortError') {
        throw new Error(`DeepSeek API timeout after ${timeoutMs}ms`);
      }

      // Retry on network errors or retryable status codes
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.log(`[DeepSeek] Error, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES}):`, error.message);
        await sleep(delay);
        continue;
      }

      throw error;
    }
  }

  throw lastError || new Error('DeepSeek API call failed after retries');
}

