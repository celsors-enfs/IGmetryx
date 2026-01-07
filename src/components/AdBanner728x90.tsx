import { useEffect, useRef, useState } from 'react';

export const AdBanner728x90 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scriptLoadedRef = useRef(false);
  const instanceIdRef = useRef<string>(`b728-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`);

  useEffect(() => {
    const ensureVisible = () => {
      if (wrapperRef.current) {
        wrapperRef.current.style.setProperty('display', 'block', 'important');
        wrapperRef.current.style.setProperty('visibility', 'visible', 'important');
        wrapperRef.current.style.setProperty('opacity', '1', 'important');
      }
      if (containerRef.current) {
        containerRef.current.style.setProperty('display', 'block', 'important');
        containerRef.current.style.setProperty('visibility', 'visible', 'important');
        containerRef.current.style.setProperty('opacity', '1', 'important');
        containerRef.current.style.setProperty('min-height', '90px', 'important');
        containerRef.current.style.setProperty('width', '100%', 'important');
        containerRef.current.style.setProperty('max-width', '728px', 'important');
      }
    };

    const loadBanner = () => {
      if (!containerRef.current || scriptLoadedRef.current) return;

      ensureVisible();

      // Set atOptions globally before script loads
      (window as any).atOptions = {
        'key': 'fd5e713fffe17e898e3165198deb6008',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };

      // Check if script exists
      const scriptId = `adsterra-728x90-${instanceIdRef.current}`;
      let existingScript = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!existingScript) {
        existingScript = document.createElement('script');
        existingScript.type = 'text/javascript';
        existingScript.src = 'https://www.topcreativeformat.com/fd5e713fffe17e898e3165198deb6008/invoke.js';
        existingScript.async = true;
        existingScript.id = scriptId;
        existingScript.setAttribute('data-ad-key', 'fd5e713fffe17e898e3165198deb6008');
        
        // Append to document body, not container
        document.body.appendChild(existingScript);
        
        // Also try appending to container as fallback
        if (containerRef.current) {
          containerRef.current.appendChild(existingScript.cloneNode(true) as HTMLScriptElement);
        }
      }

      scriptLoadedRef.current = true;
      ensureVisible();
    };

    // Immediate load
    ensureVisible();
    loadBanner();

    // Retry with delays
    const timers = [
      setTimeout(() => { ensureVisible(); loadBanner(); }, 100),
      setTimeout(() => { ensureVisible(); loadBanner(); }, 500),
      setTimeout(() => { ensureVisible(); loadBanner(); }, 1500),
      setTimeout(() => { ensureVisible(); loadBanner(); }, 3000),
      setTimeout(() => { ensureVisible(); loadBanner(); }, 5000),
    ];

    // Observer for container
    if (containerRef.current) {
      const observer = new MutationObserver(() => {
        ensureVisible();
        if (!scriptLoadedRef.current) loadBanner();
      });
      observer.observe(containerRef.current, { 
        childList: true, 
        subtree: true, 
        attributes: true,
        attributeFilter: ['style', 'class']
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

  return (
    <div 
      ref={wrapperRef}
      className="w-full flex justify-center items-center py-4 my-4 bg-gray-50"
      style={{ 
        display: 'block', 
        visibility: 'visible', 
        opacity: 1,
        width: '100%',
        minHeight: '90px'
      }}
    >
      <div 
        ref={containerRef}
        id={`ad-banner-728x90-${instanceIdRef.current}`}
        className="min-h-[90px] w-full max-w-[728px] flex justify-center items-center"
        style={{ 
          display: 'block', 
          visibility: 'visible', 
          opacity: 1,
          minHeight: '90px',
          width: '100%',
          maxWidth: '728px'
        }}
      ></div>
    </div>
  );
};

