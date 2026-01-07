import { useEffect, useRef } from 'react';

export const AdBanner728x90 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceIdRef = useRef<string>(`b728-${Date.now()}`);

  useEffect(() => {
    const loadBanner = () => {
      if (!containerRef.current) return;

      // Set atOptions - use unique instance to avoid conflicts
      const uniqueKey = `atOptions_728x90_${instanceIdRef.current}`;
      (window as any)[uniqueKey] = {
        'key': 'fd5e713fffe17e898e3165198deb6008',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };
      
      // Also set global for compatibility
      (window as any).atOptions = {
        'key': 'fd5e713fffe17e898e3165198deb6008',
        'format': 'iframe',
        'height': 90,
        'width': 728,
        'params': {}
      };

      // Create script if it doesn't exist - use unique ID per instance
      const scriptId = `adsterra-728x90-script-${instanceIdRef.current}`;
      let existingScript = document.getElementById(scriptId) as HTMLScriptElement;
      
      if (!existingScript) {
        // Check if any script with this key exists
        const allScripts = document.querySelectorAll('script[src*="fd5e713fffe17e898e3165198deb6008"]');
        if (allScripts.length === 0) {
          existingScript = document.createElement('script');
          existingScript.id = scriptId;
          existingScript.type = 'text/javascript';
          existingScript.src = 'https://www.topcreativeformat.com/fd5e713fffe17e898e3165198deb6008/invoke.js';
          existingScript.async = true;
          existingScript.setAttribute('data-ad-key', 'fd5e713fffe17e898e3165198deb6008');
          
          // Append to container
          containerRef.current.appendChild(existingScript);
        }
      }

      // Ensure container is visible
      containerRef.current.style.setProperty('display', 'flex', 'important');
      containerRef.current.style.setProperty('justify-content', 'center', 'important');
      containerRef.current.style.setProperty('align-items', 'center', 'important');
      containerRef.current.style.setProperty('visibility', 'visible', 'important');
      containerRef.current.style.setProperty('opacity', '1', 'important');
    };

    const ensureVisible = () => {
      if (containerRef.current) {
        containerRef.current.style.setProperty('display', 'flex', 'important');
        containerRef.current.style.setProperty('justify-content', 'center', 'important');
        containerRef.current.style.setProperty('align-items', 'center', 'important');
        containerRef.current.style.setProperty('visibility', 'visible', 'important');
        containerRef.current.style.setProperty('opacity', '1', 'important');
        containerRef.current.style.setProperty('width', '100%', 'important');
        containerRef.current.style.setProperty('min-height', '90px', 'important');
      }
      
      // Find and show all related iframes and divs
      const allElements = document.querySelectorAll('iframe, div[id*="728x90"], div[class*="728x90"]');
      allElements.forEach((el: Element) => {
        const htmlEl = el as HTMLElement;
        
        // Check if it's an iframe and has the src property
        if (el.tagName === 'IFRAME') {
          const iframe = el as HTMLIFrameElement;
          if (iframe.src && iframe.src.includes('fd5e713fffe17e898e3165198deb6008')) {
            htmlEl.style.setProperty('display', 'block', 'important');
            htmlEl.style.setProperty('visibility', 'visible', 'important');
            htmlEl.style.setProperty('opacity', '1', 'important');
          }
        } else if (htmlEl.innerHTML && htmlEl.innerHTML.includes('fd5e713fffe17e898e3165198deb6008')) {
          htmlEl.style.setProperty('display', 'block', 'important');
          htmlEl.style.setProperty('visibility', 'visible', 'important');
          htmlEl.style.setProperty('opacity', '1', 'important');
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
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        visibility: 'visible', 
        opacity: 1,
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
          visibility: 'visible', 
          opacity: 1,
          minHeight: '90px',
          width: '100%',
          maxWidth: '728px',
          margin: '0 auto'
        }}
      ></div>
    </div>
  );
};

