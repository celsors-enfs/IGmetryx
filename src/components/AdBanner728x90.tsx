import { useEffect, useRef } from 'react';

export const AdBanner728x90 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const instanceIdRef = useRef<string>(`banner-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    const loadBanner = () => {
      if (!containerRef.current) return;

      // Set atOptions before loading script - use unique key per instance
      const uniqueKey = `atOptions_728x90_${instanceIdRef.current}`;
      (window as any)[uniqueKey] = {
        'key': 'fd5e713fffe17e898e3165198deb6008',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };
      
      // Also set global atOptions for compatibility
      (window as any).atOptions = {
        'key': 'fd5e713fffe17e898e3165198deb6008',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };

      // Check if script already exists globally
      const existingScript = document.querySelector('script[src*="fd5e713fffe17e898e3165198deb6008"]');
      
      if (!existingScript) {
        // Create and append script
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://www.topcreativeformat.com/fd5e713fffe17e898e3165198deb6008/invoke.js';
        script.async = true;
        script.id = `adsterra-banner-728x90-script-${instanceIdRef.current}`;
        
        // Append to container
        containerRef.current.appendChild(script);
      }

      // Ensure container is visible
      if (containerRef.current) {
        containerRef.current.style.setProperty('display', 'block', 'important');
        containerRef.current.style.setProperty('visibility', 'visible', 'important');
        containerRef.current.style.setProperty('opacity', '1', 'important');
        containerRef.current.style.setProperty('min-height', '90px', 'important');
      }

      scriptLoadedRef.current = true;
    };

    // Load immediately
    if (!scriptLoadedRef.current) {
      loadBanner();
    }

    // Also try after delays to ensure DOM is ready
    const timeoutId1 = setTimeout(() => {
      if (!scriptLoadedRef.current) loadBanner();
    }, 500);
    
    const timeoutId2 = setTimeout(() => {
      if (!scriptLoadedRef.current) loadBanner();
    }, 2000);

    // Watch for container changes
    if (containerRef.current) {
      const observer = new MutationObserver(() => {
        if (!scriptLoadedRef.current) loadBanner();
      });
      observer.observe(containerRef.current, { childList: true, subtree: true, attributes: true });
      
      return () => {
        clearTimeout(timeoutId1);
        clearTimeout(timeoutId2);
        observer.disconnect();
      };
    }

    return () => {
      clearTimeout(timeoutId1);
      clearTimeout(timeoutId2);
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-4 my-4 bg-gray-50">
      <div 
        ref={containerRef}
        id={`ad-banner-728x90-${instanceIdRef.current}`}
        className="min-h-[90px] w-full max-w-[728px] flex justify-center items-center"
        style={{ display: 'block', visibility: 'visible', opacity: 1 }}
      ></div>
    </div>
  );
};

