import { useEffect } from 'react';

export const AdSidebar = () => {
  useEffect(() => {
    const ensureAdsVisible = () => {
      const container = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
      if (container) {
        // Force visibility with all possible overrides
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
        container.style.setProperty('position', 'fixed', 'important');
        container.style.setProperty('z-index', '1000', 'important');
        container.style.setProperty('pointer-events', 'auto', 'important');
        
        // Ensure all children are visible
        Array.from(container.children).forEach((child: Element) => {
          (child as HTMLElement).style.setProperty('display', 'block', 'important');
          (child as HTMLElement).style.setProperty('visibility', 'visible', 'important');
          (child as HTMLElement).style.setProperty('opacity', '1', 'important');
        });
      }
    };

    // Run immediately and multiple times
    ensureAdsVisible();
    const timers = [
      setTimeout(ensureAdsVisible, 50),
      setTimeout(ensureAdsVisible, 200),
      setTimeout(ensureAdsVisible, 500),
      setTimeout(ensureAdsVisible, 1000),
      setTimeout(ensureAdsVisible, 2000),
      setTimeout(ensureAdsVisible, 5000),
    ];

    // Watch for container changes
    const container = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
    if (container) {
      const observer = new MutationObserver(() => {
        ensureAdsVisible();
      });
      observer.observe(container, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['style', 'class', 'display', 'visibility', 'opacity']
      });
      
      return () => {
        timers.forEach(clearTimeout);
        observer.disconnect();
      };
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return null;
};

