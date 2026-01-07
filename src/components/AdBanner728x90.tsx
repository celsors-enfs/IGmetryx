import { useEffect, useRef } from 'react';

export const AdBanner728x90 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const instanceIdRef = useRef<string>(`b728-${Date.now()}`);

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

    const loadBanner = () => {
      if (!containerRef.current) return;

      // Set atOptions
      (window as any).atOptions = {
        'key': 'fd5e713fffe17e898e3165198deb6008',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };

      // Create script if it doesn't exist
      const scriptId = `adsterra-728x90-${instanceIdRef.current}`;
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.type = 'text/javascript';
        script.src = 'https://www.topcreativeformat.com/fd5e713fffe17e898e3165198deb6008/invoke.js';
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
    <div 
      className="w-full flex justify-center items-center py-4 my-4 bg-gray-50"
      style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        minHeight: '90px'
      }}
    >
      <div 
        ref={containerRef}
        id={`ad-banner-728x90-${instanceIdRef.current}`}
        className="min-h-[90px] w-full max-w-[728px] flex justify-center items-center mx-auto"
        style={{ 
          display: 'flex', 
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          minHeight: '90px',
          maxWidth: '728px'
        }}
      ></div>
    </div>
  );
};

