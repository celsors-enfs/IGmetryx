import { useEffect, useRef } from 'react';

export const AdBanner160x600 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const instanceIdRef = useRef<string>(`b160-${Date.now()}`);

  useEffect(() => {
    const ensureBannerVisible = () => {
      // Force container visibility
      const container = document.querySelector('.ad-left-sidebar-container') as HTMLElement;
      if (container) {
        container.style.setProperty('display', 'flex', 'important');
        container.style.setProperty('visibility', 'visible', 'important');
        container.style.setProperty('opacity', '1', 'important');
        container.style.setProperty('position', 'fixed', 'important');
        container.style.setProperty('left', '20px', 'important');
        container.style.setProperty('top', '100px', 'important');
        container.style.setProperty('z-index', '999', 'important');
        container.style.setProperty('width', '160px', 'important');
        container.style.setProperty('min-height', '600px', 'important');
        container.style.setProperty('pointer-events', 'auto', 'important');
      }
      
      // Force inner container visibility
      if (containerRef.current) {
        containerRef.current.style.setProperty('display', 'flex', 'important');
        containerRef.current.style.setProperty('visibility', 'visible', 'important');
        containerRef.current.style.setProperty('opacity', '1', 'important');
        containerRef.current.style.setProperty('width', '160px', 'important');
        containerRef.current.style.setProperty('min-height', '600px', 'important');
        containerRef.current.style.setProperty('max-width', '160px', 'important');
      }
    };

    const loadBanner = () => {
      if (!containerRef.current) return;

      // Set atOptions
      (window as any).atOptions = {
        'key': 'd39a8cf1c58bc0b5b60cadcade8a8b74',
        'format': 'iframe',
        'height': 600,
        'width': 160,
        'params': {}
      };

      // Create script if it doesn't exist
      const scriptId = `adsterra-160x600-${instanceIdRef.current}`;
      const existingScript = document.getElementById(scriptId);
      
      if (!existingScript) {
        // Check if any script with this key exists
        const allScripts = document.querySelectorAll('script[src*="d39a8cf1c58bc0b5b60cadcade8a8b74"]');
        if (allScripts.length === 0) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.type = 'text/javascript';
          script.src = 'https://www.topcreativeformat.com/d39a8cf1c58bc0b5b60cadcade8a8b74/invoke.js';
          script.async = true;
          script.setAttribute('data-ad-key', 'd39a8cf1c58bc0b5b60cadcade8a8b74');
          
          if (containerRef.current) {
            containerRef.current.appendChild(script);
          }
        }
      }

      // Force visibility
      ensureBannerVisible();
      
      // Find and show related iframes
      const allIframes = document.querySelectorAll('iframe');
      allIframes.forEach((iframe: HTMLIFrameElement) => {
        if (iframe.src && iframe.src.includes('d39a8cf1c58bc0b5b60cadcade8a8b74')) {
          iframe.style.setProperty('display', 'block', 'important');
          iframe.style.setProperty('visibility', 'visible', 'important');
          iframe.style.setProperty('opacity', '1', 'important');
          iframe.style.setProperty('width', '160px', 'important');
          iframe.style.setProperty('height', '600px', 'important');
          iframe.style.setProperty('max-width', '160px', 'important');
        }
      });

      if (!scriptLoadedRef.current) {
        scriptLoadedRef.current = true;
      }
    };

    // Ensure visibility immediately
    ensureBannerVisible();
    
    // Load banner immediately
    loadBanner();
    
    // Retry multiple times
    const timers = [
      setTimeout(() => { ensureBannerVisible(); loadBanner(); }, 100),
      setTimeout(() => { ensureBannerVisible(); loadBanner(); }, 500),
      setTimeout(() => { ensureBannerVisible(); loadBanner(); }, 2000),
      setTimeout(() => { ensureBannerVisible(); loadBanner(); }, 5000),
    ];
    
    // Observer for DOM changes
    const observer = new MutationObserver(() => {
      ensureBannerVisible();
      loadBanner();
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true
      });
    }
    
    // Also run on resize
    const handleResize = () => {
      ensureBannerVisible();
      loadBanner();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div 
      className="ad-left-sidebar-container"
      style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '160px',
        minHeight: '600px',
        background: 'transparent'
      }}
    >
      <div 
        ref={containerRef}
        id={`ad-banner-160x600-${instanceIdRef.current}`}
        className="ad-banner-160x600-inner"
        style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'flex-start',
          width: '160px',
          minHeight: '600px',
          maxWidth: '160px'
        }}
      ></div>
    </div>
  );
};

