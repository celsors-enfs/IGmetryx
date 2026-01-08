/**
 * AdSlot - Unified Ad Component
 * Handles all ad types with consistent loading, visibility, and retry logic
 */

import { useEffect, useRef, useState } from 'react';
import {
  AdSlotType,
  AD_CONFIGS,
  loadScriptOnce,
  setAtOptions,
  detectIframeInContainer,
  ensureContainerVisible,
  retrySlot,
  isDebugMode,
  debugLog,
} from './adsterra';

interface AdSlotProps {
  type: AdSlotType;
  position?: 'left' | 'right';
  className?: string;
  lazy?: boolean; // Lazy load for below-the-fold ads
}

interface SlotState {
  status: 'idle' | 'loading' | 'loaded' | 'failed';
  retryCount: number;
  error?: string;
  iframeFound: boolean;
}

export function AdSlot({ type, position, className = '', lazy = false }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<SlotState>({
    status: 'idle',
    retryCount: 0,
    iframeFound: false,
  });
  const instanceIdRef = useRef<string>(`${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
  const config = AD_CONFIGS[type];
  const debug = isDebugMode();
  const [inView, setInView] = useState(!lazy); // Start visible if not lazy

  // Simple Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [lazy]);

  // Load slot
  const loadSlot = async (): Promise<boolean> => {
    if (!containerRef.current) {
      debugLog(`[${type}] Container not available`);
      return false;
    }

    try {
      setState(prev => ({ ...prev, status: 'loading' }));

      // For native ads, use existing container from index.html
      if (type === 'native') {
        const nativeContainer = document.getElementById(config.containerId!);
        if (nativeContainer) {
          // Load native ad script into body/head (not container)
          await loadScriptOnce(config);
          debugLog(`[${type}] Native script loaded`);
          
          // Wait and check for content multiple times
          for (let i = 0; i < 5; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const hasContent = nativeContainer.children.length > 0;
            if (hasContent) {
              debugLog(`[${type}] Native content found after ${i + 1}s`);
              setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
              ensureContainerVisible(nativeContainer, config, position);
              return true;
            }
          }
          setState(prev => ({ ...prev, status: 'failed', error: 'Native content not found' }));
          return false;
        } else {
          setState(prev => ({ ...prev, status: 'failed', error: 'Native container not found' }));
          return false;
        }
      } else {
        // For banner ads: Set atOptions FIRST (before script injection)
        setAtOptions(config);
        debugLog(`[${type}] atOptions set`);

        // Ensure container has proper ID (Adsterra looks for it)
        const containerId = `ad-banner-${type}-${instanceIdRef.current}`;
        if (!containerRef.current.id || containerRef.current.id !== containerId) {
          containerRef.current.id = containerId;
          debugLog(`[${type}] Container ID set: ${containerId}`);
        }

        // Inject script DIRECTLY into container (NOT head/body)
        // Adsterra needs script in container to know where to inject iframe
        const scriptId = `adsterra-${type}-${instanceIdRef.current}`;
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.type = 'text/javascript';
          script.src = config.scriptUrl;
          script.async = true;
          script.setAttribute('data-ad-key', config.key);
          script.setAttribute('data-cfasync', 'false');
          
          // CRITICAL: Append to container, not head/body
          containerRef.current.appendChild(script);
          debugLog(`[${type}] Script injected into container: ${containerId}`);
        } else {
          debugLog(`[${type}] Script already exists: ${scriptId}`);
        }

        // Wait for iframe with multiple checks (like old code)
        let iframe: HTMLIFrameElement | null = null;
        
        // Check immediately
        iframe = containerRef.current.querySelector('iframe') as HTMLIFrameElement;
        if (iframe) {
          debugLog(`[${type}] Iframe found immediately`);
          setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
          ensureContainerVisible(containerRef.current, config, position);
          return true;
        }

        // Wait and check multiple times (like old working code)
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          iframe = containerRef.current.querySelector('iframe') as HTMLIFrameElement;
          if (iframe) {
            debugLog(`[${type}] Iframe found after ${i + 1} checks`);
            setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
            ensureContainerVisible(containerRef.current, config, position);
            return true;
          }
        }
        
        // Final check after longer delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        iframe = containerRef.current.querySelector('iframe') as HTMLIFrameElement;
        if (iframe) {
          debugLog(`[${type}] Iframe found after final delay`);
          setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
          ensureContainerVisible(containerRef.current, config, position);
          return true;
        }
        
        setState(prev => ({ ...prev, status: 'failed', error: 'Iframe not detected after 7s' }));
        debugLog(`[${type}] Iframe not detected after all attempts`);
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, status: 'failed', error: errorMessage }));
      debugLog(`[${type}] Load failed:`, errorMessage);
      return false;
    }
  };

  // Initial load - MUST run immediately when container is available
  useEffect(() => {
    // Wait for container to be available
    const initLoad = () => {
      if (!containerRef.current) {
        // Container not ready yet, wait a bit
        setTimeout(initLoad, 50);
        return;
      }

      if (lazy && !inView) {
        return; // Wait for intersection
      }

      // Ensure visibility first
      if (containerRef.current) {
        ensureContainerVisible(containerRef.current, config, position);
      }

      // Load immediately for above-the-fold or non-lazy
      const attemptLoad = async () => {
        if (!containerRef.current) return;
        
        // Force visibility before loading
        ensureContainerVisible(containerRef.current, config, position);
        
        const success = await retrySlot(loadSlot, 2, 1000);
        if (!success) {
          setState(prev => ({ ...prev, retryCount: 2 }));
          // Try one more time after delay
          setTimeout(() => {
            if (containerRef.current) {
              ensureContainerVisible(containerRef.current, config, position);
              loadSlot();
            }
          }, 3000);
        }
      };

      attemptLoad();
    };

    // Start immediately
    initLoad();
  }, [lazy, inView, type, position]);

  // Listen for route changes
  useEffect(() => {
    const handleRouteChange = () => {
      debugLog(`[${type}] Route changed, refreshing slot`);
      // Reset and reload
      setState({ status: 'idle', retryCount: 0, iframeFound: false });
      
      // Reset atOptions before reload
      if (type !== 'native') {
        setAtOptions(config);
      }
      
      setTimeout(() => {
        if (containerRef.current) {
          ensureContainerVisible(containerRef.current, config, position);
          loadSlot();
        }
      }, 500);
    };

    window.addEventListener('adsterra:route-change', handleRouteChange);
    return () => {
      window.removeEventListener('adsterra:route-change', handleRouteChange);
    };
  }, []);

  // Ensure visibility on mount and updates
  useEffect(() => {
    if (containerRef.current && state.status === 'loaded') {
      ensureContainerVisible(containerRef.current, config, position);
    }
  }, [state.status, position]);

  // MutationObserver for detecting iframe injection - ALWAYS active
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new MutationObserver(() => {
      if (containerRef.current) {
        // Check for iframe
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe && !state.iframeFound) {
          debugLog(`[${type}] Iframe detected via MutationObserver`);
          setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
          ensureContainerVisible(containerRef.current, config, position);
        }
        
        // Also ensure container is always visible
        if (containerRef.current) {
          ensureContainerVisible(containerRef.current, config, position);
        }
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Also check periodically for iframes
    const interval = setInterval(() => {
      if (containerRef.current && !state.iframeFound) {
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe) {
          debugLog(`[${type}] Iframe found via periodic check`);
          setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
          ensureContainerVisible(containerRef.current, config, position);
        }
      }
    }, 1000);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [type, position]); // Re-run if position changes, but keep observer active

  // Get container dimensions
  const containerStyle: React.CSSProperties = {
    width: `${config.width}px`,
    minHeight: `${config.height}px`,
    maxWidth: `${config.width}px`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
    flexShrink: 0,
    flexGrow: 0,
  };

  // Position-specific styles
  if (position === 'left') {
    Object.assign(containerStyle, {
      position: 'fixed',
      left: '20px',
      top: '100px',
      zIndex: 999,
    });
  } else if (position === 'right') {
    Object.assign(containerStyle, {
      position: 'fixed',
      right: '20px',
      top: '100px',
      zIndex: 1000,
    });
  }

  // For native ads, use existing container
  if (type === 'native') {
    return (
      <div
        id={config.containerId}
        className={`ad-slot-native ${className}`}
        style={{
          position: 'fixed',
          right: '20px',
          top: '100px',
          zIndex: 1000,
          width: '200px',
          minHeight: '100px',
          maxHeight: 'calc(100vh - 120px)',
          overflowY: 'auto',
        }}
      >
        {debug && (
          <div className="ad-debug-badge">
            Native: {state.status} | Retry: {state.retryCount}
            {state.error && ` | Error: ${state.error}`}
          </div>
        )}
      </div>
    );
  }

  // Ensure visibility when ref is set
  const setContainerRef = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (node) {
      // Immediately ensure visibility when container is set
      ensureContainerVisible(node, config, position);
    }
  };

  // Periodic visibility check
  useEffect(() => {
    if (!containerRef.current) return;
    
    const interval = setInterval(() => {
      if (containerRef.current && containerRef.current.parentNode) {
        ensureContainerVisible(containerRef.current, config, position);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [type, position]);

  // Container ID for Adsterra (important for script to find container)
  // Note: Native ads return early, so type here is always a banner type
  const containerId = `ad-banner-${type}-${instanceIdRef.current}`;

  return (
    <div
      ref={setContainerRef}
      id={containerId}
      className={`ad-slot ad-slot-${type} ${className}`}
      style={containerStyle}
    >
      {debug && (
        <div
          className="ad-debug-badge"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            fontSize: '10px',
            zIndex: 10000,
            pointerEvents: 'none',
          }}
        >
          {type} | {state.status} | Retry: {state.retryCount}
          {state.iframeFound && ' | Iframe: ✓'}
          {state.error && ` | Error: ${state.error}`}
        </div>
      )}
      {state.status === 'failed' && debug && (
        <div style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
          Ad failed to load
        </div>
      )}
    </div>
  );
}

