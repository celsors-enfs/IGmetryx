/**
 * IGmetryx Feed Snapshot - Service Worker (Background)
 * 
 * Handles:
 * - Capture orchestration
 * - Tab management
 * - Image stitching via OffscreenCanvas
 * - Communication with content script and web app
 */

const EXTENSION_VERSION = '1.0.0';
const MAX_FRAMES = 200;
const OVERLAP_PIXELS = 120; // Overlap between frames for stitching
const SCROLL_WAIT_MS = 1200; // Wait for content to load after scroll
const IDLE_CHECK_MS = 300; // Check for idle state

let captureState = null;
let offscreenDocument = null;

/**
 * Create offscreen document for image processing
 */
async function createOffscreenDocument() {
  if (offscreenDocument) return;
  
  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['WORKERS'],
      justification: 'Image stitching requires OffscreenCanvas API'
    });
    offscreenDocument = true;
  } catch (e) {
    // Already exists or error
    console.warn('Offscreen document:', e.message);
  }
}

/**
 * Close offscreen document
 */
async function closeOffscreenDocument() {
  if (!offscreenDocument) return;
  
  try {
    await chrome.offscreen.closeDocument();
    offscreenDocument = null;
  } catch (e) {
    console.warn('Close offscreen:', e.message);
  }
}

/**
 * Capture visible tab screenshot
 */
async function captureTabScreenshot(tabId) {
  try {
    console.log('[IGMETRYX] captureTabScreenshot: Starting for tab', tabId);
    
    // First, activate the tab to make it visible
    const tab = await chrome.tabs.get(tabId);
    console.log('[IGMETRYX] Tab info:', { id: tab.id, url: tab.url, active: tab.active });
    
    // Activate the tab first
    await chrome.tabs.update(tabId, { active: true });
    console.log('[IGMETRYX] Tab activated');
    
    // Focus the window
    await chrome.windows.update(tab.windowId, { focused: true });
    console.log('[IGMETRYX] Window focused');
    
    // Wait a bit for tab to be visible and rendered
    await new Promise(resolve => setTimeout(resolve, 800));
    console.log('[IGMETRYX] Waiting for tab visibility...');
    
    // Get the window that contains this tab
    const window = await chrome.windows.get(tab.windowId);
    console.log('[IGMETRYX] Window ID:', window.id);
    
    // Verify tab is now active
    const updatedTab = await chrome.tabs.get(tabId);
    console.log('[IGMETRYX] Tab active status:', updatedTab.active);
    
    if (!updatedTab.active) {
      // Try one more time to activate
      console.log('[IGMETRYX] Tab not active, trying again...');
      await chrome.tabs.update(tabId, { active: true });
      await new Promise(resolve => setTimeout(resolve, 500));
      const retryTab = await chrome.tabs.get(tabId);
      if (!retryTab.active) {
        throw new Error('Tab could not be activated. Please ensure the Instagram tab is visible.');
      }
    }
    
    // Wait a bit more to ensure tab is fully rendered
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Capture from the window containing this tab
    // We have host_permissions for instagram.com, which should allow capture
    // But captureVisibleTab still requires the tab to be active
    // Try with the specific window ID first (more reliable with host_permissions)
    const window = await chrome.windows.get(tab.windowId);
    console.log('[IGMETRYX] Window ID:', window.id);
    console.log('[IGMETRYX] Calling captureVisibleTab with window ID:', window.id);
    
    let dataUrl;
    try {
      // Try with specific window ID first
      dataUrl = await chrome.tabs.captureVisibleTab(window.id, {
        format: 'png',
        quality: 100
      });
      console.log('[IGMETRYX] Capture successful with window ID');
    } catch (windowIdError) {
      // If that fails, try with null (current window)
      console.log('[IGMETRYX] Capture with window ID failed, trying with null...');
      console.log('[IGMETRYX] Error:', windowIdError.message);
      try {
        dataUrl = await chrome.tabs.captureVisibleTab(null, {
          format: 'png',
          quality: 100
        });
        console.log('[IGMETRYX] Capture successful with null window ID');
      } catch (nullError) {
        console.error('[IGMETRYX] Both capture methods failed');
        console.error('[IGMETRYX] Window ID error:', windowIdError.message);
        console.error('[IGMETRYX] Null error:', nullError.message);
        
        // Provide a more helpful error message
        if (nullError.message && nullError.message.includes('permission')) {
          throw new Error('Permission denied. Please ensure: 1) The Instagram tab is active, 2) You have granted the extension permission to access Instagram, 3) Try clicking the extension icon first to activate permissions.');
        }
        throw nullError; // Throw the original error
      }
    }
    console.log('[IGMETRYX] Screenshot captured! Size:', dataUrl.length, 'chars');
    return dataUrl;
  } catch (e) {
    console.error('[IGMETRYX] Screenshot error:', e);
    console.error('[IGMETRYX] Error message:', e.message);
    console.error('[IGMETRYX] Error stack:', e.stack);
    
    // Check if it's a permission error
    if (e.message && e.message.includes('permission')) {
      throw new Error(`Permission error: ${e.message}. Make sure the extension has 'activeTab' permission and the tab is active.`);
    }
    
    throw new Error(`Screenshot failed: ${e.message}`);
  }
}

/**
 * Send message to content script in tab
 */
async function sendToContentScript(tabId, message, timeout = 5000) {
  try {
    console.log('[IGMETRYX] Sending message to content script:', message.type, 'tab:', tabId);
    
    // Add timeout to prevent hanging
    const response = await Promise.race([
      chrome.tabs.sendMessage(tabId, message),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Content script response timeout')), timeout)
      )
    ]);
    
    console.log('[IGMETRYX] Content script response:', response);
    return response;
  } catch (e) {
    console.error('[IGMETRYX] Content script communication error:', e);
    console.error('[IGMETRYX] Error details:', e.message);
    console.error('[IGMETRYX] Error stack:', e.stack);
    
    // Check if tab still exists
    try {
      const tab = await chrome.tabs.get(tabId);
      console.log('[IGMETRYX] Tab still exists:', tab.url);
    } catch (tabError) {
      console.error('[IGMETRYX] Tab no longer exists!');
      throw new Error('Instagram tab was closed or no longer accessible');
    }
    
    throw new Error(`Content script communication failed: ${e.message}. The content script may not be loaded on this page.`);
  }
}

/**
 * Send progress update to web app
 */
function sendProgressToWebApp(progress) {
  // Broadcast to all tabs (web app will listen)
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        type: 'IGMETRYX_CAPTURE_PROGRESS',
        ...progress
      }).catch(() => {
        // Ignore errors for tabs that don't have listener
      });
    });
  });
}

/**
 * Start capture process
 */
async function startCapture(message, sender) {
  if (captureState) {
    throw new Error('Capture already in progress');
  }

  const { tabId, options = {} } = message;
  
  if (!tabId) {
    throw new Error('No tab ID provided');
  }

  try {
    // Verify tab is Instagram
    const tab = await chrome.tabs.get(tabId);
    const url = tab.url || '';
    
    console.log('[IGMETRYX] Verifying tab:', tabId, 'URL:', url);
    
    // Check if it's an Instagram URL (must be http/https, not chrome-extension)
    if (!url.includes('instagram.com') || 
        url.startsWith('chrome-extension://') || 
        url.startsWith('chrome://')) {
      console.error('[IGMETRYX] Invalid tab URL:', url);
      throw new Error('Selected tab is not an Instagram page. Please open an Instagram profile page (https://www.instagram.com/username) in a new tab first.');
    }
    
    console.log('[IGMETRYX] Tab verified as Instagram:', url);
    
    // IMPORTANT: For activeTab permission to work, the tab MUST be active
    // AND the user must have interacted with the extension
    // We cannot activate the tab programmatically - it won't work with activeTab
    // The user must manually activate the Instagram tab before clicking "Capture Snapshot"
    if (!tab.active) {
      console.error('[IGMETRYX] Tab is not active! User must activate it manually.');
      throw new Error('The Instagram tab is not active. Please click on the Instagram tab to make it active, then try again.');
    }
    
    console.log('[IGMETRYX] Tab is active, proceeding with capture');

    // Initialize capture state
    captureState = {
      tabId,
      frames: [],
      isActive: true,
      options: {
        cropTop: options.cropTop || 0, // Pixels to crop from top (for sticky header)
        maxHeight: options.maxHeight || 50000,
        ...options
      }
    };

    // Create offscreen document for stitching
    await createOffscreenDocument();

    // Inject content script if needed and start capture
    try {
      console.log('[IGMETRYX] Injecting content script into tab:', tabId);
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content-script.js']
      });
      console.log('[IGMETRYX] Content script injected successfully');
    } catch (e) {
      console.error('[IGMETRYX] Content script injection failed:', e);
      console.error('[IGMETRYX] Error details:', e.message);
      // Try to continue - script might already be injected
      console.warn('[IGMETRYX] Continuing anyway - script may already be present');
    }

    // Wait a bit for script to be ready and verify it's loaded
    console.log('[IGMETRYX] Waiting for content script to initialize...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Try to ping the content script to verify it's loaded
    try {
      console.log('[IGMETRYX] Verifying content script is loaded...');
      const pingResponse = await sendToContentScript(tabId, {
        type: 'IGMETRYX_PING'
      }, 2000);
      console.log('[IGMETRYX] Content script ping response:', pingResponse);
      if (!pingResponse || pingResponse.type !== 'IGMETRYX_PONG') {
        throw new Error('Content script did not respond correctly to ping');
      }
      console.log('[IGMETRYX] Content script verified and ready!');
    } catch (e) {
      console.error('[IGMETRYX] Content script verification failed:', e);
      throw new Error(`Content script is not loaded on Instagram page: ${e.message}. Please reload the Instagram page and try again.`);
    }

    // Send start command to content script
    console.log('[IGMETRYX] Sending start capture command to content script...');
    await sendToContentScript(tabId, {
      type: 'IGMETRYX_START_CAPTURE',
      options: captureState.options
    });
    console.log('[IGMETRYX] Start capture command sent');

    sendProgressToWebApp({
      step: 'capturing',
      percent: 0,
      frames: 0,
      statusText: 'Starting capture...'
    });

    // Start capture loop
    captureLoop(tabId);

  } catch (error) {
    captureState = null;
    sendProgressToWebApp({
      step: 'error',
      error: {
        code: 'CAPTURE_START_FAILED',
        message: error.message
      }
    });
    throw error;
  }
}

/**
 * Main capture loop - scrolls and captures frames
 */
async function captureLoop(tabId) {
  if (!captureState || !captureState.isActive) return;

  // Set overall timeout for the entire capture process
  const loopTimeout = setTimeout(() => {
    console.error('[IGMETRYX] Capture loop timeout - stopping after 5 minutes');
    if (captureState) {
      captureState.isActive = false;
    }
    sendProgressToWebApp({
      step: 'error',
      error: {
        code: 'CAPTURE_TIMEOUT',
        message: 'Capture took too long and was stopped. The page may be too large or there was an issue.'
      }
    });
    captureState = null;
  }, LOOP_TIMEOUT_MS);

  try {
    console.log('[IGMETRYX] Starting capture loop for tab:', tabId);
    
    // Get page dimensions from content script
    let pageInfo;
    try {
      pageInfo = await sendToContentScript(tabId, {
        type: 'IGMETRYX_GET_PAGE_INFO'
      });
    } catch (e) {
      console.error('[IGMETRYX] Failed to get page info:', e);
      throw new Error(`Failed to communicate with Instagram page: ${e.message}`);
    }

    if (!pageInfo) {
      throw new Error('Could not get page information');
    }
    
    console.log('[IGMETRYX] Page info:', pageInfo);

    const { viewportHeight, documentHeight, isPrivate } = pageInfo;

    if (isPrivate) {
      throw new Error('Cannot capture private profiles');
    }

    // Scroll to top
    console.log('[IGMETRYX] Scrolling to top of page...');
    try {
      const scrollResponse = await sendToContentScript(tabId, {
        type: 'IGMETRYX_SCROLL',
        y: 0
      }, 3000); // 3 second timeout
      console.log('[IGMETRYX] Scroll to top response:', scrollResponse);
    } catch (e) {
      console.error('[IGMETRYX] Scroll to top failed:', e);
      console.error('[IGMETRYX] Error details:', e.message, e.stack);
      // Continue anyway - scroll might have worked even if response failed
      console.log('[IGMETRYX] Continuing despite scroll error...');
    }
    console.log('[IGMETRYX] Scroll to top complete, waiting for page to settle...');
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('[IGMETRYX] Page settled after scroll to top');

    let scrollY = 0;
    let lastFrameData = null;
    let duplicateCount = 0;
    const maxDuplicateCount = 3; // Stop after 3 identical frames

    console.log('[IGMETRYX] ===== ENTERING CAPTURE LOOP =====');
    console.log('[IGMETRYX] captureState:', captureState ? 'exists' : 'null');
    console.log('[IGMETRYX] captureState.isActive:', captureState?.isActive);
    console.log('[IGMETRYX] Page dimensions:', { viewportHeight, documentHeight });

    while (captureState && captureState.isActive) {
      console.log('[IGMETRYX] ===== LOOP ITERATION START =====');
      console.log('[IGMETRYX] Current frame count:', captureState.frames.length);
      // Check limits
      if (captureState.frames.length >= MAX_FRAMES) {
        break;
      }

      // Calculate current composite height
      const currentHeight = captureState.options.cropTop > 0 
        ? captureState.frames.length * (viewportHeight - captureState.options.cropTop - OVERLAP_PIXELS)
        : captureState.frames.length * (viewportHeight - OVERLAP_PIXELS);

      if (currentHeight >= captureState.options.maxHeight) {
        break;
      }

      // Wait for page to stabilize
      console.log('[IGMETRYX] Waiting for page to stabilize...');
      await new Promise(resolve => setTimeout(resolve, IDLE_CHECK_MS));
      console.log('[IGMETRYX] Page stabilized');
      
      // Wait for images to load
      console.log('[IGMETRYX] Checking if images are loading...');
      const loadResult = await sendToContentScript(tabId, {
        type: 'IGMETRYX_WAIT_FOR_IMAGES'
      });
      console.log('[IGMETRYX] Images load check result:', loadResult);

      if (loadResult && loadResult.stillLoading) {
        console.log('[IGMETRYX] Images still loading, waiting more...');
        await new Promise(resolve => setTimeout(resolve, SCROLL_WAIT_MS));
      }

      // Capture screenshot with timeout
      console.log('[IGMETRYX] ===== ABOUT TO CAPTURE SCREENSHOT =====');
      console.log('[IGMETRYX] Frame number:', captureState.frames.length + 1);
      console.log('[IGMETRYX] Current scroll position:', scrollY);
      
      let screenshotDataUrl;
      try {
        screenshotDataUrl = await Promise.race([
          captureTabScreenshot(tabId),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Screenshot capture timeout')), CAPTURE_TIMEOUT_MS)
          )
        ]);
        console.log('[IGMETRYX] ===== SCREENSHOT CAPTURED =====');
      } catch (captureError) {
        console.error('[IGMETRYX] Screenshot capture failed or timed out:', captureError);
        if (captureError.message && captureError.message.includes('timeout')) {
          throw new Error('Screenshot capture timed out. The page may be too slow to load.');
        }
        throw captureError;
      }

      // Convert to ImageData for comparison (check if duplicate)
      console.log('[IGMETRYX] Processing image for duplicate detection...');
      let img, imageData;
      try {
        console.log('[IGMETRYX] Creating image from data URL...');
        img = await createImageFromDataUrl(screenshotDataUrl);
        console.log('[IGMETRYX] Image created, dimensions:', img.width, 'x', img.height);
        
        // Create a temporary offscreen canvas for image data extraction
        const sampleHeight = Math.min(200, img.height);
        console.log('[IGMETRYX] Creating canvas for sample:', img.width, 'x', sampleHeight);
        const canvas = new OffscreenCanvas(img.width, sampleHeight);
        const ctx = canvas.getContext('2d');
        console.log('[IGMETRYX] Drawing image to canvas...');
        ctx.drawImage(img, 0, 0, img.width, sampleHeight);
        console.log('[IGMETRYX] Extracting image data...');
        imageData = ctx.getImageData(0, 0, img.width, sampleHeight); // Sample top 200px
        console.log('[IGMETRYX] Image data extracted, length:', imageData.data.length);
      } catch (e) {
        console.error('[IGMETRYX] ===== IMAGE PROCESSING FAILED =====');
        console.error('[IGMETRYX] Error:', e);
        console.error('[IGMETRYX] Error message:', e.message);
        console.error('[IGMETRYX] Error stack:', e.stack);
        // Skip duplicate check if image processing fails, but continue capture
        imageData = null;
      }

      // Check if duplicate (skip if imageData is null)
      console.log('[IGMETRYX] Checking for duplicate frames...');
      if (imageData) {
        if (lastFrameData && imagesAreSimilar(lastFrameData, imageData, 0.95)) {
          duplicateCount++;
          console.log('[IGMETRYX] Duplicate frame detected! Count:', duplicateCount);
          if (duplicateCount >= maxDuplicateCount) {
            console.log('[IGMETRYX] Max duplicates reached, stopping capture');
            // Reached end or stuck
            break;
          }
        } else {
          duplicateCount = 0;
          console.log('[IGMETRYX] Unique frame, adding to collection');
          captureState.frames.push({
            dataUrl: screenshotDataUrl,
            scrollY,
            timestamp: Date.now()
          });
          lastFrameData = imageData;
        }
      } else {
        // If image processing failed, still add frame but don't check duplicates
        console.log('[IGMETRYX] Image processing failed, adding frame without duplicate check');
        duplicateCount = 0;
        captureState.frames.push({
          dataUrl: screenshotDataUrl,
          scrollY,
          timestamp: Date.now()
        });
      }
      
      console.log('[IGMETRYX] Total frames so far:', captureState.frames.length);

      // Update progress
      const percent = Math.min(100, (scrollY / Math.max(1, documentHeight - viewportHeight)) * 100);
      sendProgressToWebApp({
        step: 'capturing',
        percent: Math.round(percent),
        frames: captureState.frames.length,
        statusText: `Captured ${captureState.frames.length} frames...`
      });

      // Check if reached bottom
      if (scrollY + viewportHeight >= documentHeight - 10) {
        break;
      }

      // Scroll down
      const scrollAmount = viewportHeight - OVERLAP_PIXELS;
      scrollY += scrollAmount;
      
      console.log('[IGMETRYX] Scrolling to position:', scrollY);
      await sendToContentScript(tabId, {
        type: 'IGMETRYX_SCROLL',
        y: scrollY
      });
      console.log('[IGMETRYX] Scroll command sent');

      // Wait for scroll to complete
      console.log('[IGMETRYX] Waiting for scroll to complete...');
      await new Promise(resolve => setTimeout(resolve, SCROLL_WAIT_MS));
      console.log('[IGMETRYX] Scroll complete, continuing loop...');
    }

    // Capture finished - start stitching
    if (captureState && captureState.frames.length > 0) {
      sendProgressToWebApp({
        step: 'processing',
        percent: 100,
        frames: captureState.frames.length,
        statusText: 'Stitching images...'
      });

      await stitchFrames(captureState.frames, captureState.options);
    }

  } catch (error) {
    sendProgressToWebApp({
      step: 'error',
      error: {
        code: 'CAPTURE_LOOP_FAILED',
        message: error.message
      }
    });
    captureState = null;
  }
}

/**
 * Create Image from data URL
 * Note: In service worker context, we need to use a different approach
 */
async function createImageFromDataUrl(dataUrl) {
  try {
    console.log('[IGMETRYX] createImageFromDataUrl: Starting, data URL length:', dataUrl.length);
    // In service worker, we can't use Image() directly
    // Convert data URL to blob and create image bitmap
    console.log('[IGMETRYX] createImageFromDataUrl: Fetching data URL...');
    const response = await fetch(dataUrl);
    console.log('[IGMETRYX] createImageFromDataUrl: Fetch response received');
    const blob = await response.blob();
    console.log('[IGMETRYX] createImageFromDataUrl: Blob created, size:', blob.size, 'bytes');
    console.log('[IGMETRYX] createImageFromDataUrl: Creating image bitmap...');
    const imageBitmap = await createImageBitmap(blob);
    console.log('[IGMETRYX] createImageFromDataUrl: ImageBitmap created, dimensions:', imageBitmap.width, 'x', imageBitmap.height);
    return imageBitmap;
  } catch (e) {
    console.error('[IGMETRYX] createImageFromDataUrl: ERROR:', e);
    console.error('[IGMETRYX] createImageFromDataUrl: Error message:', e.message);
    console.error('[IGMETRYX] createImageFromDataUrl: Error stack:', e.stack);
    throw e;
  }
}

/**
 * Compare two ImageData objects for similarity
 */
function imagesAreSimilar(imgData1, imgData2, threshold = 0.95) {
  if (imgData1.data.length !== imgData2.data.length) return false;
  
  let matches = 0;
  const total = imgData1.data.length / 4; // RGBA = 4 bytes per pixel
  
  for (let i = 0; i < imgData1.data.length; i += 4) {
    const r1 = imgData1.data[i];
    const g1 = imgData1.data[i + 1];
    const b1 = imgData1.data[i + 2];
    
    const r2 = imgData2.data[i];
    const g2 = imgData2.data[i + 1];
    const b2 = imgData2.data[i + 2];
    
    // Simple RGB distance
    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );
    
    if (distance < 10) { // Very similar pixels
      matches++;
    }
  }
  
  return matches / total >= threshold;
}

/**
 * Stitch frames together with overlap detection
 */
async function stitchFrames(frames, options) {
  try {
    // Create offscreen document for processing
    await createOffscreenDocument();

    // Send stitching request to offscreen
    const result = await chrome.runtime.sendMessage({
      type: 'IGMETRYX_STITCH',
      frames: frames.map(f => f.dataUrl),
      options
    });

    if (!result || !result.success) {
      throw new Error(result?.error || 'Stitching failed');
    }

    // Send result to web app
    sendProgressToWebApp({
      step: 'done',
      pngDataUrl: result.pngDataUrl,
      meta: {
        height: result.height,
        width: result.width,
        frames: frames.length
      }
    });

    captureState = null;
    await closeOffscreenDocument();

  } catch (error) {
    sendProgressToWebApp({
      step: 'error',
      error: {
        code: 'STITCHING_FAILED',
        message: error.message
      }
    });
    captureState = null;
  }
}

/**
 * Stop capture
 */
function stopCapture() {
  if (captureState) {
    captureState.isActive = false;
    captureState = null;
  }
  closeOffscreenDocument();
  
  sendProgressToWebApp({
    step: 'stopped',
    statusText: 'Capture stopped by user'
  });
}

// Message listeners
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[IGMETRYX Service Worker] Received message:', message.type, message);
  
  if (message.type === 'IGMETRYX_START_CAPTURE') {
    console.log('[IGMETRYX Service Worker] Starting capture...');
    // Find Instagram tab - query all tabs and filter for Instagram
    chrome.tabs.query({}, (allTabs) => {
      let targetTab = null;
      
      console.log('[IGMETRYX Service Worker] Searching through', allTabs.length, 'tabs...');
      
      // Filter out chrome-extension:// and chrome:// URLs - only look at http/https pages
      const validTabs = allTabs.filter(tab => {
        const url = tab.url || '';
        // Only include http/https URLs, exclude chrome extensions and chrome:// pages
        return (url.startsWith('http://') || url.startsWith('https://')) &&
               !url.startsWith('chrome-extension://') &&
               !url.startsWith('chrome://');
      });
      
      console.log('[IGMETRYX Service Worker] Valid tabs (http/https only):', validTabs.length);
      
      // First, check if current active tab is Instagram
      const activeTab = validTabs.find(tab => tab.active && tab.windowId);
      if (activeTab && activeTab.url && activeTab.url.includes('instagram.com')) {
        targetTab = activeTab;
        console.log('[IGMETRYX Service Worker] Found active Instagram tab:', targetTab.id, targetTab.url);
      } else {
        // Find any Instagram tab (must be https://www.instagram.com or https://instagram.com)
        targetTab = validTabs.find(tab => {
          const url = tab.url || '';
          // Must be an Instagram URL
          return url.includes('instagram.com');
        });
        
        if (targetTab) {
          console.log('[IGMETRYX Service Worker] Found Instagram tab:', targetTab.id, targetTab.url);
        } else {
          console.log('[IGMETRYX Service Worker] No Instagram tab found. Available valid tabs:');
          validTabs.slice(0, 5).forEach(tab => {
            console.log('  - Tab', tab.id + ':', tab.url?.substring(0, 60) + '...', tab.active ? '(active)' : '');
          });
        }
      }
      
      if (!targetTab) {
        sendProgressToWebApp({
          step: 'error',
          error: {
            code: 'NO_INSTAGRAM_TAB',
            message: 'Please open an Instagram profile page (https://www.instagram.com/username) in a new tab first, then try again.'
          }
        });
        sendResponse({ success: false, error: 'No Instagram tab found. Please open an Instagram page first.' });
        return;
      }
      
      startCapture({ ...message, tabId: targetTab.id }, sender)
        .then(() => {
          console.log('[IGMETRYX Service Worker] startCapture completed');
          sendResponse({ success: true });
        })
        .catch(error => {
          console.error('[IGMETRYX Service Worker] startCapture error:', error);
          sendProgressToWebApp({
            step: 'error',
            error: {
              code: 'CAPTURE_FAILED',
              message: error.message
            }
          });
          sendResponse({ success: false, error: error.message });
        });
    });
    return true; // Async response
  }

  if (message.type === 'IGMETRYX_STOP_CAPTURE') {
    stopCapture();
    sendResponse({ success: true });
    return true;
  }

  if (message.type === 'IGMETRYX_PING') {
    sendResponse({ 
      type: 'IGMETRYX_PONG', 
      version: EXTENSION_VERSION 
    });
    return true;
  }

  if (message.type === 'IGMETRYX_STITCH') {
    // Forward to offscreen document
    stitchFrames(message.frames, message.options || {})
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

// Handle extension install
chrome.runtime.onInstalled.addListener(() => {
  console.log('IGmetryx Feed Snapshot extension installed');
});

