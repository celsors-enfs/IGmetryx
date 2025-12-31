/**
 * DeepSeek API Client
 * 
 * Robust client with retries, timeouts, and error handling
 */

export interface DeepSeekParams {
  systemPrompt: string;
  userPrompt: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

const DEFAULT_TIMEOUT_MS = 25000; // 25 seconds per call
const MAX_RETRIES = 3;
const RETRYABLE_STATUS_CODES = [429, 502, 503, 504];
const RATE_LIMIT_STATUS = 429;
const INSUFFICIENT_BALANCE_STATUS = 402;

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
export async function callDeepSeek(params: DeepSeekParams): Promise<string> {
  const { systemPrompt, userPrompt, baseUrl, apiKey, model } = params;
  
  // Ensure baseUrl is correct - DeepSeek uses /v1/chat/completions
  let endpoint: string;
  if (baseUrl.includes('/v1')) {
    // Already has /v1, use as-is
    endpoint = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  } else {
    // Add /v1/chat/completions
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    endpoint = `${cleanBase}/v1/chat/completions`;
  }
  
  console.log('[DeepSeek] 📡 Calling endpoint:', endpoint);
  console.log('[DeepSeek] 📝 System prompt length:', systemPrompt.length);
  console.log('[DeepSeek] 📝 User prompt length:', userPrompt.length);
  
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
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any = null;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          // Not JSON, use text
        }

        const errorMessage = errorData?.error?.message || errorText || `HTTP ${response.status}`;
        console.error(`[DeepSeek] ❌ HTTP ${response.status} error:`, errorMessage.substring(0, 200));

        // Handle specific error cases
        if (response.status === RATE_LIMIT_STATUS && attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt) * 2; // Longer delay for rate limits
          console.log(`[DeepSeek] ⏳ Rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(delay);
          continue;
        }
        
        if (response.status === INSUFFICIENT_BALANCE_STATUS) {
          const error: any = new Error(`Service temporarily unavailable`);
          error.code = 'INSUFFICIENT_BALANCE';
          error.status = response.status;
          throw error;
        }
        
        // Retry on retryable status codes
        if (RETRYABLE_STATUS_CODES.includes(response.status) && attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          console.log(`[DeepSeek] 🔄 Retryable error ${response.status}, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          continue;
        }

        // Non-retryable error
        const error: any = new Error(`API error (${response.status}): ${errorMessage.substring(0, 200)}`);
        error.status = response.status;
        error.code = response.status === 400 ? 'BAD_REQUEST' : 'API_ERROR';
        throw error;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error('[DeepSeek] ❌ No content in response. Full response:', JSON.stringify(data, null, 2));
        throw new Error('No content in DeepSeek response');
      }

      console.log('[DeepSeek] ✅ Received content, length:', content.length, 'chars');
      console.log('[DeepSeek] 📄 Content preview (first 200 chars):', content.substring(0, 200));
      return content;
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;

      // Don't retry on abort (timeout) or non-retryable errors
      if (error.name === 'AbortError') {
        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          console.log(`[DeepSeek] ⏳ Timeout, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(delay);
          continue;
        }
        const timeoutError: any = new Error(`Request timeout after ${timeoutMs}ms`);
        timeoutError.code = 'TIMEOUT';
        throw timeoutError;
      }
      
      // Re-throw if it's already a structured error
      if (error.code) {
        throw error;
      }
      
      // Network errors
      if (error.message?.includes('fetch') || error.message?.includes('network')) {
        if (attempt < MAX_RETRIES) {
          const delay = getRetryDelay(attempt);
          console.error(`[DeepSeek] ❌ Network error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error.message);
          console.log(`[DeepSeek] 🔄 Retrying in ${Math.round(delay)}ms...`);
          await sleep(delay);
          continue;
        }
        const networkError: any = new Error('Network error');
        networkError.code = 'NETWORK_ERROR';
        throw networkError;
      }
      
      // Retry on network errors or retryable status codes
      if (attempt < MAX_RETRIES) {
        const delay = getRetryDelay(attempt);
        console.error(`[DeepSeek] ❌ Error (attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, error.message);
        console.log(`[DeepSeek] 🔄 Retrying in ${Math.round(delay)}ms...`);
        await sleep(delay);
        continue;
      }

      console.error(`[DeepSeek] ❌ Failed after ${MAX_RETRIES + 1} attempts:`, error.message);
      throw error;
    }
  }

  throw lastError || new Error('DeepSeek API call failed after retries');
}

