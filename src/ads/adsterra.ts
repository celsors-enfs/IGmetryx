/**
 * Adsterra Ad Integration Utilities
 * Centralized script loading and slot management
 */

export type AdSlotType = 
  | 'banner-160x600' 
  | 'banner-728x90' 
  | 'banner-468x60'
  | 'native';

export interface AdSlotConfig {
  key: string;
  width: number;
  height: number;
  scriptUrl: string;
  containerId?: string; // For native ads
}

export const AD_CONFIGS: Record<AdSlotType, AdSlotConfig> = {
  'banner-160x600': {
    key: 'd39a8cf1c58bc0b5b60cadcade8a8b74',
    width: 160,
    height: 600,
    scriptUrl: 'https://www.topcreativeformat.com/d39a8cf1c58bc0b5b60cadcade8a8b74/invoke.js',
  },
  'banner-728x90': {
    key: 'fd5e713fffe17e898e3165198deb6008',
    width: 728,
    height: 90,
    scriptUrl: 'https://www.topcreativeformat.com/fd5e713fffe17e898e3165198deb6008/invoke.js',
  },
  'banner-468x60': {
    key: '5122725d16be0a76aecfc0db70048d68',
    width: 468,
    height: 60,
    scriptUrl: 'https://www.topcreativeformat.com/5122725d16be0a76aecfc0db70048d68/invoke.js',
  },
  'native': {
    key: 'f3930ade229bc20a0c616d08517f4ef9',
    width: 200,
    height: 200,
    scriptUrl: 'https://pl28418932.effectivegatecpm.com/f3930ade229bc20a0c616d08517f4ef9/invoke.js',
    containerId: 'container-f3930ade229bc20a0c616d08517f4ef9',
  },
};

// Global script loading state
const loadedScripts = new Set<string>();
const loadingScripts = new Map<string, Promise<void>>();

/**
 * Check if debug mode is enabled via URL param
 */
export function isDebugMode(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('adsDebug') === '1';
}

/**
 * Debug logger (only logs in debug mode)
 */
export function debugLog(...args: any[]): void {
  if (isDebugMode()) {
    console.log('[Adsterra]', ...args);
  }
}

/**
 * Load Adsterra script once (prevents duplicates)
 */
export async function loadScriptOnce(config: AdSlotConfig): Promise<void> {
  const scriptId = `adsterra-script-${config.key}`;
  
  // Already loaded
  if (loadedScripts.has(config.key)) {
    debugLog(`Script already loaded for key: ${config.key}`);
    return;
  }

  // Currently loading
  if (loadingScripts.has(config.key)) {
    debugLog(`Script already loading for key: ${config.key}`);
    return loadingScripts.get(config.key)!;
  }

  // Start loading
  const loadPromise = new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Document not available'));
      return;
    }

    // Check if script already exists in DOM
    const existingScript = document.getElementById(scriptId) as HTMLScriptElement;
    if (existingScript) {
      loadedScripts.add(config.key);
      loadingScripts.delete(config.key);
      debugLog(`Script found in DOM for key: ${config.key}`);
      resolve();
      return;
    }

    // Check for any script with this URL
    const allScripts = document.querySelectorAll(`script[src*="${config.key}"]`);
    if (allScripts.length > 0) {
      loadedScripts.add(config.key);
      loadingScripts.delete(config.key);
      debugLog(`Script found by URL for key: ${config.key}`);
      resolve();
      return;
    }

    // Create and inject script
    const script = document.createElement('script');
    script.id = scriptId;
    script.type = 'text/javascript';
    script.src = config.scriptUrl;
    script.async = true;
    script.setAttribute('data-ad-key', config.key);
    script.setAttribute('data-cfasync', 'false');

    script.onload = () => {
      loadedScripts.add(config.key);
      loadingScripts.delete(config.key);
      debugLog(`Script loaded successfully for key: ${config.key}`);
      resolve();
    };

    script.onerror = () => {
      loadingScripts.delete(config.key);
      debugLog(`Script failed to load for key: ${config.key}`);
      reject(new Error(`Failed to load script for ${config.key}`));
    };

    // Append to head or body
    const target = document.head || document.body;
    target.appendChild(script);
  });

  loadingScripts.set(config.key, loadPromise);
  return loadPromise;
}

/**
 * Set atOptions for a banner ad
 */
export function setAtOptions(config: AdSlotConfig): void {
  if (typeof window === 'undefined') return;
  
  (window as any).atOptions = {
    key: config.key,
    format: 'iframe',
    height: config.height,
    width: config.width,
    params: {},
  };
  
  debugLog(`Set atOptions for ${config.key}:`, { width: config.width, height: config.height });
}

/**
 * Detect iframe in container
 */
export function detectIframeInContainer(
  container: HTMLElement,
  config: AdSlotConfig,
  timeout: number = 5000
): Promise<HTMLIFrameElement | null> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const check = () => {
      // Check for iframe with matching key in src
      const iframes = container.querySelectorAll('iframe');
      for (const iframe of Array.from(iframes)) {
        if (iframe.src && iframe.src.includes(config.key)) {
          debugLog(`Iframe found for ${config.key}`);
          resolve(iframe as HTMLIFrameElement);
          return;
        }
      }

      // For native ads, check for any content
      if (config.containerId) {
        const nativeContainer = document.getElementById(config.containerId);
        if (nativeContainer && nativeContainer.children.length > 0) {
          debugLog(`Native ad content found for ${config.key}`);
          resolve(null); // Native ads don't use iframes
          return;
        }
      }

      // Timeout
      if (Date.now() - startTime > timeout) {
        debugLog(`Iframe detection timeout for ${config.key}`);
        resolve(null);
        return;
      }

      // Retry
      setTimeout(check, 200);
    };

    check();
  });
}

/**
 * Ensure container visibility and correct sizing
 */
export function ensureContainerVisible(
  container: HTMLElement,
  config: AdSlotConfig,
  position?: 'left' | 'right'
): void {
  // Force visibility
  container.style.setProperty('display', 'flex', 'important');
  container.style.setProperty('visibility', 'visible', 'important');
  container.style.setProperty('opacity', '1', 'important');
  container.style.setProperty('pointer-events', 'auto', 'important');
  
  // Set exact dimensions
  container.style.setProperty('width', `${config.width}px`, 'important');
  container.style.setProperty('min-height', `${config.height}px`, 'important');
  container.style.setProperty('max-width', `${config.width}px`, 'important');
  container.style.setProperty('overflow', 'visible', 'important');
  
  // Position-specific styles
  if (position === 'left') {
    container.style.setProperty('position', 'fixed', 'important');
    container.style.setProperty('left', '20px', 'important');
    container.style.setProperty('top', '100px', 'important');
    container.style.setProperty('z-index', '999', 'important');
  } else if (position === 'right') {
    container.style.setProperty('position', 'fixed', 'important');
    container.style.setProperty('right', '20px', 'important');
    container.style.setProperty('top', '100px', 'important');
    container.style.setProperty('z-index', '1000', 'important');
  }
  
  // Ensure iframes are visible and correctly sized
  const iframes = container.querySelectorAll('iframe');
  iframes.forEach((iframe) => {
    iframe.style.setProperty('display', 'block', 'important');
    iframe.style.setProperty('visibility', 'visible', 'important');
    iframe.style.setProperty('opacity', '1', 'important');
    iframe.style.setProperty('width', `${config.width}px`, 'important');
    iframe.style.setProperty('height', `${config.height}px`, 'important');
    iframe.style.setProperty('max-width', `${config.width}px`, 'important');
    iframe.style.setProperty('border', 'none', 'important');
  });
}

/**
 * Retry slot loading with bounded attempts
 */
export async function retrySlot(
  fn: () => Promise<boolean>,
  maxRetries: number = 2,
  delay: number = 1000
): Promise<boolean> {
  for (let i = 0; i <= maxRetries; i++) {
    const success = await fn();
    if (success) return true;
    
    if (i < maxRetries) {
      debugLog(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return false;
}

