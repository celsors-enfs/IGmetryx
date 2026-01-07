import { useEffect } from 'react';

export const AdSidebar = () => {
  useEffect(() => {
    const ensureAdsVisible = () => {
      const container = document.getElementById('container-f3930ade229bc20a0c616d08517f4ef9');
      if (container) {
        // Force visibility on all screen sizes - including mobile
        const isMobile = window.innerWidth <= 768;
        
        container.style.setProperty('display', 'block', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
        container.style.setProperty('position', 'fixed', 'important');
        container.style.setProperty('z-index', '1000', 'important');
        container.style.setProperty('pointer-events', 'auto', 'important');
        
        if (isMobile) {
          container.style.setProperty('right', '5px', 'important');
          container.style.setProperty('top', '70px', 'important');
          container.style.setProperty('max-width', '120px', 'important');
          container.style.setProperty('width', '120px', 'important');
        }
        
        // Ensure children are visible
        Array.from(container.children).forEach((child: Element) => {
          const htmlEl = child as HTMLElement;
          htmlEl.style.setProperty('display', 'block', 'important');
          htmlEl.style.setProperty('visibility', 'visible', 'important');
          htmlEl.style.setProperty('opacity', '1', 'important');
          
          if (isMobile) {
            htmlEl.style.setProperty('max-width', '120px', 'important');
            htmlEl.style.setProperty('width', '120px', 'important');
            htmlEl.style.setProperty('height', '120px', 'important');
          }
        });
      }
    };

    // Run immediately
    ensureAdsVisible();
    
    // Retry multiple times
    const timers = [
      setTimeout(ensureAdsVisible, 100),
      setTimeout(ensureAdsVisible, 500),
      setTimeout(ensureAdsVisible, 2000),
      setTimeout(ensureAdsVisible, 5000),
    ];
    
    // Also run on resize
    const handleResize = () => {
      ensureAdsVisible();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return null;
};

