/**
 * IGmetryx Feed Snapshot - Content Script
 * 
 * Runs on Instagram pages to:
 * - Detect if page is private
 * - Control scrolling
 * - Wait for content to load
 * - Report page dimensions
 */

(function() {
  'use strict';
  
  console.log('[IGMETRYX Content Script] ===== CONTENT SCRIPT LOADED =====');
  console.log('[IGMETRYX Content Script] URL:', window.location.href);
  console.log('[IGMETRYX Content Script] Ready to receive messages');

  const INSTAGRAM_DOMAIN = 'instagram.com';

  /**
   * Check if current page is an Instagram profile page
   */
  function isInstagramProfile() {
    return window.location.hostname.includes(INSTAGRAM_DOMAIN) &&
           (window.location.pathname.match(/^\/([^\/]+)\/?$/) || 
            window.location.pathname.match(/^\/p\//));
  }

  /**
   * Check if profile is private
   */
  function isPrivateProfile() {
    // Look for private account indicators
    const privateIndicators = [
      'This Account is Private',
      'Esta cuenta es privada',
      'Esta conta é privada',
      'Ce compte est privé'
    ];

    const bodyText = document.body.innerText || '';
    return privateIndicators.some(indicator => 
      bodyText.includes(indicator)
    );
  }

  /**
   * Get page information
   */
  function getPageInfo() {
    return {
      viewportHeight: window.innerHeight,
      viewportWidth: window.innerWidth,
      documentHeight: Math.max(
        document.body.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight,
        document.documentElement.offsetHeight
      ),
      documentWidth: Math.max(
        document.body.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.clientWidth,
        document.documentElement.scrollWidth,
        document.documentElement.offsetWidth
      ),
      isPrivate: isPrivateProfile(),
      isProfile: isInstagramProfile()
    };
  }

  /**
   * Scroll page to position
   */
  function scrollTo(y) {
    window.scrollTo({
      top: y,
      left: 0,
      behavior: 'instant' // Instant scroll, not smooth
    });
    
    // Wait for scroll to complete
    return new Promise(resolve => {
      // Use requestAnimationFrame to ensure scroll is done
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

  /**
   * Wait for images to load
   */
  function waitForImages(timeout = 2000) {
    return new Promise((resolve) => {
      const images = document.querySelectorAll('img');
      const totalImages = images.length;
      let loadedCount = 0;
      let stillLoading = false;

      if (totalImages === 0) {
        resolve({ stillLoading: false });
        return;
      }

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount >= totalImages) {
          resolve({ stillLoading: false });
        }
      };

      images.forEach(img => {
        if (img.complete && img.naturalHeight > 0) {
          checkComplete();
        } else {
          stillLoading = true;
          img.addEventListener('load', checkComplete, { once: true });
          img.addEventListener('error', checkComplete, { once: true });
        }
      });

      // Timeout fallback
      setTimeout(() => {
        resolve({ stillLoading: stillLoading && loadedCount < totalImages });
      }, timeout);
    });
  }

  /**
   * Hide sticky elements temporarily (optional, for cleaner capture)
   */
  function hideStickyElements() {
    const stickySelectors = [
      'header',
      '[role="banner"]',
      'nav',
      '.fixed',
      '[style*="position: fixed"]'
    ];

    const hiddenElements = [];
    stickySelectors.forEach(selector => {
      try {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const style = window.getComputedStyle(el);
          if (style.position === 'fixed' || style.position === 'sticky') {
            el.style.display = 'none';
            hiddenElements.push(el);
          }
        });
      } catch (e) {
        // Ignore selector errors
      }
    });

    return hiddenElements;
  }

  /**
   * Restore hidden elements
   */
  function restoreElements(elements) {
    elements.forEach(el => {
      el.style.display = '';
    });
  }

  let hiddenElements = [];

  // Message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[IGMETRYX Content Script] Received message:', message.type);
    
    if (message.type === 'IGMETRYX_PING') {
      sendResponse({ 
        type: 'IGMETRYX_PONG', 
        version: '1.0.0' 
      });
      return true;
    }

    if (message.type === 'IGMETRYX_START_CAPTURE') {
      // Hide sticky elements if requested
      if (message.options?.hideSticky) {
        hiddenElements = hideStickyElements();
      }
      
      sendResponse({ success: true });
      return true;
    }

    if (message.type === 'IGMETRYX_GET_PAGE_INFO') {
      const info = getPageInfo();
      console.log('[IGMETRYX Content Script] Page info:', info);
      sendResponse(info);
      return true;
    }

    if (message.type === 'IGMETRYX_SCROLL') {
      console.log('[IGMETRYX Content Script] Received scroll command, y:', message.y);
      console.log('[IGMETRYX Content Script] Current scroll position:', window.scrollY);
      
      // Execute scroll immediately
      try {
        window.scrollTo({
          top: message.y,
          left: 0,
          behavior: 'instant'
        });
        console.log('[IGMETRYX Content Script] window.scrollTo called');
        
        // Wait for scroll to complete using requestAnimationFrame
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            console.log('[IGMETRYX Content Script] Scroll animation complete, new scrollY:', window.scrollY);
            sendResponse({ success: true, scrollY: window.scrollY });
          });
        });
      } catch (error) {
        console.error('[IGMETRYX Content Script] Scroll error:', error);
        sendResponse({ success: false, error: error.message });
      }
      
      return true; // Keep channel open for async response
    }

    if (message.type === 'IGMETRYX_WAIT_FOR_IMAGES') {
      waitForImages().then(result => {
        sendResponse(result);
      });
      return true;
    }

    if (message.type === 'IGMETRYX_STOP') {
      restoreElements(hiddenElements);
      hiddenElements = [];
      sendResponse({ success: true });
      return true;
    }
  });

  // Forward messages from web app to service worker
  window.addEventListener('message', (event) => {
    // Only accept messages from same origin (web app)
    if (event.origin !== window.location.origin) return;

    // Handle ping/pong for extension detection
    if (event.data && event.data.type === 'IGMETRYX_PING') {
      window.postMessage({
        type: 'IGMETRYX_PONG',
        version: '1.0.0',
        source: 'content-script'
      }, window.location.origin);
      return;
    }

    // Forward capture commands to service worker
    if (event.data && (event.data.type === 'IGMETRYX_START_CAPTURE' || event.data.type === 'IGMETRYX_STOP_CAPTURE')) {
      chrome.runtime.sendMessage(event.data, (response) => {
        // Response handled by service worker
      });
    }
  });

  // Listen for progress updates from service worker and forward to web app
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'IGMETRYX_CAPTURE_PROGRESS') {
      // Forward to web app via postMessage
      window.postMessage(message, window.location.origin);
    }
    return true;
  });

})();

