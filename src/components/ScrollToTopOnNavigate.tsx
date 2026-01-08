import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export const ScrollToTopOnNavigate = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // If there's a hash, let AnchorScroll handle it
    if (hash) {
      return;
    }
    
    // Scroll to top immediately on pathname change (no hash)
    // Also handle initial page load
    const scrollToTop = () => {
      // Multiple methods for maximum compatibility
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      
      if (document.documentElement) {
        document.documentElement.scrollTop = 0;
        document.documentElement.scrollLeft = 0;
      }
      if (document.body) {
        document.body.scrollTop = 0;
        document.body.scrollLeft = 0;
      }
      
      // Also try scrolling any scrolling containers
      const scrollContainers = document.querySelectorAll('[style*="overflow"], .overflow-auto, .overflow-y-auto');
      scrollContainers.forEach((container: Element) => {
        const el = container as HTMLElement;
        if (el.scrollTop) {
          el.scrollTop = 0;
        }
        if (el.scrollLeft) {
          el.scrollLeft = 0;
        }
      });
    };
    
    // Immediate scroll
    scrollToTop();
    
    // Also ensure after a tiny delay (for SPA navigation)
    const timeout = setTimeout(scrollToTop, 100);
    
    return () => clearTimeout(timeout);
  }, [pathname, hash]);

  // Also handle initial page load
  useEffect(() => {
    // On mount, scroll to top
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, []);

  return null;
};





