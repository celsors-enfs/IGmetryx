import { useEffect } from 'react';

export const AdSidebar = () => {
  useEffect(() => {
    const ensureAdsVisible = () => {
      const container = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
      if (container) {
        // Force visibility
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
        container.style.setProperty('position', 'fixed', 'important');
        container.style.setProperty('z-index', '1000', 'important');
        
        // Check if script is loaded
        const script = document.querySelector('script[src*="f3930ade229bc20a0c616d08517f4ef9"]');
        if (!script) {
          console.warn('[AdSidebar] Adsterra script not found, loading...');
          const newScript = document.createElement('script');
          newScript.async = true;
          newScript.setAttribute('data-cfasync', 'false');
          newScript.src = 'https://pl28418932.effectivegatecpm.com/f3930ade229bc20a0c616d08517f4ef9/invoke.js';
          document.body.appendChild(newScript);
        }
      }
    };

    // Run immediately
    ensureAdsVisible();
    
    // Run after a short delay to ensure DOM is ready
    setTimeout(ensureAdsVisible, 100);
    setTimeout(ensureAdsVisible, 1000);
    setTimeout(ensureAdsVisible, 3000);

    // Also watch for container changes
    const container = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
    if (container) {
      const observer = new MutationObserver(() => {
        ensureAdsVisible();
      });
      observer.observe(container, { childList: true, subtree: true, attributes: true });
      
      return () => observer.disconnect();
    }
  }, []);

  return null;
};

