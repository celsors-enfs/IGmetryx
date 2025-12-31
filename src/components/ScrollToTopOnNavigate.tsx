import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTopOnNavigate = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash, let AnchorScroll handle it
    if (hash) {
      return;
    }
    
    // Scroll to top on pathname change (no hash)
    // Use double requestAnimationFrame to ensure DOM is fully rendered
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        // Scroll window
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        // Also scroll document.documentElement and body for better compatibility
        if (document.documentElement) {
          document.documentElement.scrollTop = 0;
        }
        if (document.body) {
          document.body.scrollTop = 0;
        }
      });
    });
  }, [pathname, hash]);

  return null;
};





