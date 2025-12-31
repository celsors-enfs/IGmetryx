/**
 * Web App Bridge - Content script for the web app domain
 * Handles communication between web app and extension service worker
 */

(function() {
  'use strict';

  // Listen for messages from web app
  window.addEventListener('message', (event) => {
    // Only accept messages from same origin (web app)
    if (event.origin !== window.location.origin) return;

    const message = event.data;
    if (!message || message.source !== 'web-app') return;

    // Handle ping/pong for extension detection
    if (message.type === 'IGMETRYX_PING') {
      window.postMessage({
        type: 'IGMETRYX_PONG',
        version: '1.0.0',
        source: 'extension-bridge'
      }, window.location.origin);
      return;
    }

    // Forward capture commands to service worker
    if (message.type === 'IGMETRYX_START_CAPTURE' || message.type === 'IGMETRYX_STOP_CAPTURE') {
      console.log('[IGMETRYX Bridge] Forwarding message to service worker:', message.type);
      
      // Check if extension context is still valid
      if (!chrome.runtime || !chrome.runtime.id) {
        console.error('[IGMETRYX Bridge] Extension context invalidated - extension may have been reloaded');
        window.postMessage({
          type: 'IGMETRYX_CAPTURE_PROGRESS',
          step: 'error',
          error: {
            code: 'EXTENSION_RELOADED',
            message: 'Extension was reloaded. Please refresh this page and try again.'
          }
        }, window.location.origin);
        return;
      }
      
      try {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            const errorMsg = chrome.runtime.lastError.message;
            console.error('[IGMETRYX Bridge] Error forwarding message:', errorMsg);
            
            // Check if it's a context invalidated error
            if (errorMsg.includes('Extension context invalidated') || errorMsg.includes('message port closed')) {
              window.postMessage({
                type: 'IGMETRYX_CAPTURE_PROGRESS',
                step: 'error',
                error: {
                  code: 'EXTENSION_RELOADED',
                  message: 'Extension was reloaded. Please refresh this page and try again.'
                }
              }, window.location.origin);
            } else {
              // Other errors
              window.postMessage({
                type: 'IGMETRYX_CAPTURE_PROGRESS',
                step: 'error',
                error: {
                  code: 'BRIDGE_ERROR',
                  message: errorMsg
                }
              }, window.location.origin);
            }
          } else {
            console.log('[IGMETRYX Bridge] Message forwarded successfully, response:', response);
          }
        });
      } catch (e) {
        console.error('[IGMETRYX Bridge] Exception while sending message:', e);
        window.postMessage({
          type: 'IGMETRYX_CAPTURE_PROGRESS',
          step: 'error',
          error: {
            code: 'BRIDGE_EXCEPTION',
            message: e.message || 'Failed to communicate with extension'
          }
        }, window.location.origin);
      }
    }
  });

  // Listen for progress updates from service worker and forward to web app
  try {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'IGMETRYX_CAPTURE_PROGRESS') {
        console.log('[IGMETRYX Bridge] Received progress from service worker:', message.step);
        // Forward to web app via postMessage
        window.postMessage(message, window.location.origin);
      }
      return true;
    });
  } catch (e) {
    console.error('[IGMETRYX Bridge] Failed to set up message listener:', e);
  }
})();

