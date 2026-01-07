import { useEffect, useRef } from 'react';

export const AdBanner468x60 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const instanceIdRef = useRef<string>(`b468-${Date.now()}`);

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

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
      const scriptId = `adsterra-468x60-${instanceIdRef.current}`;
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'text/javascript';
        script.src = 'https://www.topcreativeformat.com/5122725d16be0a76aecfc0db70048d68/invoke.js';
        script.async = true;
        containerRef.current.appendChild(script);
      }

      scriptLoadedRef.current = true;
    };

    // Load once
    loadBanner();
    
    // Retry once after delay
    const timer = setTimeout(loadBanner, 1000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-4 my-4 bg-gray-50">
      <div 
        ref={containerRef}
        id={`ad-banner-468x60-${instanceIdRef.current}`}
        className="min-h-[60px] w-full max-w-[468px] flex justify-center items-center mx-auto"
      ></div>
    </div>
  );
};

