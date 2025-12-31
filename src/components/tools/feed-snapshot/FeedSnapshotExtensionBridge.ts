/**
 * Extension Communication Bridge
 * Handles communication between web app and Chrome extension
 */

// Chrome extension types (only available in browser context)
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage?: (extensionId: string, message: any, callback?: (response: any) => void) => void;
        onMessage?: {
          addListener: (callback: (message: any) => boolean) => void;
          removeListener: (callback: (message: any) => boolean) => void;
        };
        lastError?: { message: string };
      };
    };
  }
}

export type CaptureStep = 'ready' | 'capturing' | 'processing' | 'done' | 'error' | 'stopped';

export interface CaptureProgress {
  step: CaptureStep;
  percent?: number;
  frames?: number;
  statusText?: string;
  pngDataUrl?: string;
  meta?: {
    height: number;
    width: number;
    frames: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Check if extension is installed and available
 * Uses postMessage which works without needing the extension ID
 */
export async function checkExtensionInstalled(): Promise<boolean> {
  return new Promise((resolve) => {
    // Send ping message via postMessage (works with content script)
    const pingMessage = {
      type: 'IGMETRYX_PING',
      source: 'web-app'
    };

    console.log('[IGMETRYX Web App] Sending ping...');
    window.postMessage(pingMessage, window.location.origin);
    
    // Wait for response from content script
    const timeout = setTimeout(() => {
      console.log('[IGMETRYX Web App] Ping timeout - extension not detected');
      resolve(false);
    }, 1000);
    
    const handler = (event: MessageEvent) => {
      console.log('[IGMETRYX Web App] Received message:', event.data);
      if (event.data?.type === 'IGMETRYX_PONG' && 
          (event.data?.source === 'content-script' || event.data?.source === 'extension-bridge')) {
        console.log('[IGMETRYX Web App] Extension detected!');
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve(true);
      }
    };
    
    window.addEventListener('message', handler);
  });
}

/**
 * Start capture
 * Uses postMessage to communicate with content script, which forwards to service worker
 */
export async function startCapture(options: {
  cropTop?: number;
  maxHeight?: number;
} = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    const message = {
      type: 'IGMETRYX_START_CAPTURE',
      options,
      source: 'web-app'
    };

    console.log('[IGMETRYX Web App] Sending START_CAPTURE message:', message);
    // Use postMessage (content script will forward to service worker)
    window.postMessage(message, window.location.origin);
    
    console.log('[IGMETRYX Web App] Message sent, assuming success');
    // For now, assume success (content script handles it)
    // In production, you might want to wait for a response
    setTimeout(() => resolve(), 100);
  });
}

/**
 * Stop capture
 */
export async function stopCapture(): Promise<void> {
  return new Promise((resolve) => {
    const message = {
      type: 'IGMETRYX_STOP_CAPTURE',
      source: 'web-app'
    };

    window.postMessage(message, window.location.origin);
    setTimeout(() => resolve(), 100);
  });
}

/**
 * Set up progress listener
 * Listens for messages from extension via postMessage
 */
export function setupProgressListener(
  onProgress: (progress: CaptureProgress) => void
): () => void {
  // Listen for messages from extension (via content script)
  const messageHandler = (event: MessageEvent) => {
    console.log('[IGMETRYX Web App] Received progress message:', event.data);
    if (event.data?.type === 'IGMETRYX_CAPTURE_PROGRESS') {
      console.log('[IGMETRYX Web App] Calling onProgress with:', event.data);
      onProgress(event.data as CaptureProgress);
    }
  };

  window.addEventListener('message', messageHandler);
  console.log('[IGMETRYX Web App] Progress listener set up');
  
  return () => {
    window.removeEventListener('message', messageHandler);
  };
}

