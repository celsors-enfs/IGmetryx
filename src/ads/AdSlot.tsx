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

      // Load script
      await loadScriptOnce(config);
      debugLog(`[${type}] Script loaded`);

      // Set atOptions for banner ads (not native)
      if (type !== 'native') {
        setAtOptions(config);
      }

      // For native ads, load script into existing container from index.html
      if (type === 'native') {
        const nativeContainer = document.getElementById(config.containerId!);
        if (nativeContainer) {
          // Load native ad script
          await loadScriptOnce(config);
          
          // Check for content
          const hasContent = nativeContainer.children.length > 0;
          if (hasContent) {
            setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
            ensureContainerVisible(nativeContainer, config, position);
            return true;
          } else {
            // Wait a bit for content to appear
            await new Promise(resolve => setTimeout(resolve, 1000));
            const hasContentAfter = nativeContainer.children.length > 0;
            if (hasContentAfter) {
              setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
              ensureContainerVisible(nativeContainer, config, position);
              return true;
            }
          }
        }
      } else {
        // Inject script into container
        const scriptId = `adsterra-${type}-${instanceIdRef.current}`;
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.type = 'text/javascript';
          script.src = config.scriptUrl;
          script.async = true;
          script.setAttribute('data-ad-key', config.key);
          script.setAttribute('data-cfasync', 'false');
          
          containerRef.current.appendChild(script);
          debugLog(`[${type}] Script injected into container`);
        }

        // Wait for iframe
        const iframe = await detectIframeInContainer(containerRef.current, config, 5000);
        
        if (iframe || containerRef.current.querySelector('iframe')) {
          setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
          ensureContainerVisible(containerRef.current, config, position);
          debugLog(`[${type}] Slot loaded successfully`);
          return true;
        } else {
          setState(prev => ({ ...prev, status: 'failed', error: 'Iframe not detected' }));
          debugLog(`[${type}] Iframe not detected`);
          return false;
        }
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({ ...prev, status: 'failed', error: errorMessage }));
      debugLog(`[${type}] Load failed:`, errorMessage);
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    if (lazy && !inView) {
      return; // Wait for intersection
    }

    // Load immediately for above-the-fold or non-lazy
    const attemptLoad = async () => {
      const success = await retrySlot(loadSlot, 2, 1000);
      if (!success) {
        setState(prev => ({ ...prev, retryCount: 2 }));
      }
    };

    attemptLoad();
  }, [lazy, inView]);

  // Listen for route changes
  useEffect(() => {
    const handleRouteChange = () => {
      debugLog(`[${type}] Route changed, refreshing slot`);
      // Reset and reload
      setState({ status: 'idle', retryCount: 0, iframeFound: false });
      setTimeout(() => {
        loadSlot();
      }, 300);
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

  // MutationObserver for detecting iframe injection
  useEffect(() => {
    if (!containerRef.current || state.status === 'loaded') return;

    const observer = new MutationObserver(() => {
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe && !state.iframeFound) {
          debugLog(`[${type}] Iframe detected via MutationObserver`);
          setState(prev => ({ ...prev, status: 'loaded', iframeFound: true }));
          ensureContainerVisible(containerRef.current, config, position);
        }
      }
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    return () => observer.disconnect();
  }, [state.status, state.iframeFound, position]);

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

  return (
    <div
      ref={containerRef}
      id={`ad-slot-${type}-${instanceIdRef.current}`}
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

