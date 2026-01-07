import { useEffect, useRef } from 'react';

export const AdBanner468x60 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptLoadedRef.current) return;

    // Set atOptions
    (window as any).atOptions = {
      'key': '5122725d16be0a76aecfc0db70048d68',
      'format': 'iframe',
      'height': 60,
      'width': 468,
      'params': {}
    };

    // Create and append script
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.topcreativeformat.com/5122725d16be0a76aecfc0db70048d68/invoke.js';
    script.async = true;
    script.id = 'adsterra-banner-468x60-script';
    
    // Append to container
    containerRef.current.appendChild(script);
    scriptLoadedRef.current = true;

    return () => {
      // Cleanup
      if (containerRef.current && script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-8 my-8 bg-gray-50">
      <div 
        ref={containerRef}
        id="ad-banner-468x60" 
        className="min-h-[60px] w-full max-w-[468px] flex justify-center items-center"
      ></div>
    </div>
  );
};

