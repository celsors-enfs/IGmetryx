/**
 * AdsterraProvider - Centralized Ad Management
 * Handles script loading, route changes, and slot lifecycle
 */

import { useEffect, useRef, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { debugLog } from './adsterra';

interface AdsterraProviderProps {
  children: ReactNode;
}

export function AdsterraProvider({ children }: AdsterraProviderProps) {
  const location = useLocation();
  const routeChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastPathRef = useRef<string>('');

  useEffect(() => {
    // Handle route changes
    const currentPath = location.pathname;
    
    if (currentPath !== lastPathRef.current) {
      debugLog('Route changed:', lastPathRef.current, '->', currentPath);
      lastPathRef.current = currentPath;
      
      // Clear any pending timeouts
      if (routeChangeTimeoutRef.current) {
        clearTimeout(routeChangeTimeoutRef.current);
      }
      
      // Schedule slot refresh after DOM settles (SPA navigation)
      routeChangeTimeoutRef.current = setTimeout(() => {
        debugLog('Triggering slot refresh after route change');
        
        // Dispatch custom event for slots to refresh
        window.dispatchEvent(new CustomEvent('adsterra:route-change', {
          detail: { path: currentPath }
        }));
      }, 500); // Wait 500ms for DOM to settle
    }

    return () => {
      if (routeChangeTimeoutRef.current) {
        clearTimeout(routeChangeTimeoutRef.current);
      }
    };
  }, [location.pathname]);

  // Initialize on mount
  useEffect(() => {
    lastPathRef.current = location.pathname;
    debugLog('AdsterraProvider initialized');
  }, []);

  return <>{children}</>;
}

