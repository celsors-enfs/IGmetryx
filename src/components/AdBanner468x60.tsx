import { useEffect, useRef } from 'react';

export const AdBanner468x60 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const instanceIdRef = useRef<string>(`banner-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const loadBanner = () => {
      if (!containerRef.current) return;

      // Set atOptions before loading script
      (window as any).atOptions = {
        'key': '5122725d16be0a76aecfc0db70048d68',
        'format': 'iframe',
        'height': 60,
        'width': 468,
        'params': {}
      };

      // Check if script already exists globally
      const existingScript = document.querySelector('script[src*="5122725d16be0a76aecfc0db70048d68"]');
      
      if (!existingScript) {
        // Create and append script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://www.topcreativeformat.com/5122725d16be0a76aecfc0db70048d68/invoke.js';
        script.async = true;
        script.id = `adsterra-banner-468x60-script-${instanceIdRef.current}`;
        
        // Append to container
        containerRef.current.appendChild(script);
      }

      // Ensure container is visible
      if (containerRef.current) {
        containerRef.current.style.setProperty('display', 'block', 'important');
        containerRef.current.style.setProperty('visibility', 'visible', 'important');
        containerRef.current.style.setProperty('opacity', '1', 'important');
        containerRef.current.style.setProperty('min-height', '60px', 'important');
      }

      scriptLoadedRef.current = true;
    };

    // Load immediately
    loadBanner();

    // Also try after delays to ensure DOM is ready
    const timeoutId1 = setTimeout(loadBanner, 500);
    const timeoutId2 = setTimeout(loadBanner, 2000);
    const timeoutId3 = setTimeout(loadBanner, 5000);

    // Watch for container changes
    if (containerRef.current) {
      const observer = new MutationObserver(() => {
        loadBanner();
      });
      observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true });
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        clearTimeout(timeoutId3);
        observer.disconnect();
      };
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-8 my-8 bg-gray-50">
      <div 
        ref={containerRef}
        id={`ad-banner-468x60-${instanceIdRef.current}`}
        className="min-h-[60px] w-full max-w-[468px] flex justify-center items-center"
        style={{ display: 'block', visibility: 'visible', opacity: 1 }}
      ></div>
    </div>
  );
};

