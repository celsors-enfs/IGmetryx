import { useEffect } from 'react';

export const AdSidebar = () => {
  useEffect(() => {
    const ensureAdsVisible = () => {
      const container = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
      if (container) {
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
      }
    };

    // Run once
    ensureAdsVisible();
    
    // Retry once after delay
    const timer = setTimeout(ensureAdsVisible, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return null;
};

