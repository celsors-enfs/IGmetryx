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
      }
    };

    // Run immediately and multiple times
    ensureAdsVisible();
    setTimeout(ensureAdsVisible, 100);
    setTimeout(ensureAdsVisible, 1000);
    setTimeout(ensureAdsVisible, 3000);

    // Watch for container changes
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

