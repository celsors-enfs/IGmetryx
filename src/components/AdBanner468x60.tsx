import { useEffect, useRef } from 'react';

export const AdBanner468x60 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const instanceIdRef = useRef<string>(`banner-${Math.random().toString(36).substr(2, 9)}`);

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

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
        containerRef.current.style.display = 'block';
        containerRef.current.style.visibility = 'visible';
        containerRef.current.style.opacity = '1';
        containerRef.current.style.minHeight = '60px';
      }

      scriptLoadedRef.current = true;
    };

    // Load immediately
    loadBanner();

    // Also try after a delay to ensure DOM is ready
    const timeoutId = setTimeout(loadBanner, 500);

    return () => {
      clearTimeout(timeoutId);
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

