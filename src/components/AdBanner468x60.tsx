import { useEffect, useRef } from 'react';

export const AdBanner468x60 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceIdRef = useRef<string>(`b468-${Date.now()}`);

  useEffect(() => {
    const loadBanner = () => {
      if (!containerRef.current) return;

      // Set atOptions
      (window as any).atOptions = {
        'key': '5122725d16be0a76aecfc0db70048d68',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };

      // Create script if it doesn't exist
      const scriptId = 'adsterra-468x60-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'text/javascript';
        script.src = 'https://www.topcreativeformat.com/5122725d16be0a76aecfc0db70048d68/invoke.js';
        script.async = true;
        containerRef.current.appendChild(script);
      }

      // Ensure container is visible
      containerRef.current.style.setProperty('display', 'block', 'important');
      containerRef.current.style.setProperty('visibility', 'visible', 'important');
      containerRef.current.style.setProperty('opacity', '1', 'important');
    };

    const ensureVisible = () => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('display', 'block', 'important');
        containerRef.current.style.setProperty('visibility', 'visible', 'important');
        containerRef.current.style.setProperty('opacity', '1', 'important');
      }
      
      // Find and show all related iframes
      const allIframes = document.querySelectorAll('iframe');
      allIframes.forEach((iframe: HTMLIFrameElement) => {
        if (iframe.src && iframe.src.includes('5122725d16be0a76aecfc0db70048d68')) {
          iframe.style.setProperty('display', 'block', 'important');
          iframe.style.setProperty('visibility', 'visible', 'important');
          iframe.style.setProperty('opacity', '1', 'important');
        }
      });
    };

    // Load banner
    loadBanner();
    ensureVisible();

    // Retry multiple times
    const timers = [
      setTimeout(() => { loadBanner(); ensureVisible(); }, 100),
      setTimeout(() => { loadBanner(); ensureVisible(); }, 500),
      setTimeout(() => { loadBanner(); ensureVisible(); }, 1000),
      setTimeout(() => { loadBanner(); ensureVisible(); }, 2000),
      setTimeout(() => { loadBanner(); ensureVisible(); }, 5000),
    ];

    // Observer
    if (containerRef.current) {
      const observer = new MutationObserver(() => {
        ensureVisible();
      });
      observer.observe(containerRef.current, { 
        childList: true, 
        subtree: true, 
        attributes: true 
      });
      
      // Also observe document for new iframes
      const docObserver = new MutationObserver(() => {
        ensureVisible();
      });
      docObserver.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      return () => {
        timers.forEach(clearTimeout);
        observer.disconnect();
        docObserver.disconnect();
      };
    }

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  return (
    <div 
      className="w-full flex justify-center items-center py-4 my-4 bg-gray-50"
      style={{ 
        display: 'block', 
        visibility: 'visible', 
        opacity: 1,
        width: '100%',
        minHeight: '60px'
      }}
    >
      <div 
        ref={containerRef}
        id={`ad-banner-468x60-${instanceIdRef.current}`}
        className="min-h-[60px] w-full max-w-[468px] flex justify-center items-center"
        style={{ 
          display: 'block', 
          visibility: 'visible', 
          opacity: 1,
          minHeight: '60px',
          width: '100%',
          maxWidth: '468px'
        }}
      ></div>
    </div>
  );
};

