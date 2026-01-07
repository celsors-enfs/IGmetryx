/**
 * IGmetryx Feed Snapshot - Offscreen Document
 * 
 * Handles image stitching using OffscreenCanvas API
 * This runs in a separate context to avoid blocking the service worker
 */

const OVERLAP_PIXELS = 120; // Overlap between frames
const OVERLAP_THRESHOLD = 0.95; // Similarity threshold for overlap detection

/**
 * Load image from data URL
 */
function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Get image data from canvas
 */
function getImageData(canvas, x, y, width, height) {
  const ctx = canvas.getContext('2d');
  return ctx.getImageData(x, y, width, height);
}

/**
 * Compare two image regions for similarity
 * Returns similarity score (0-1)
 */
function compareImageRegions(imgData1, imgData2) {
  if (imgData1.data.length !== imgData2.data.length) {
    return 0;
  }

  let totalDiff = 0;
  const pixelCount = imgData1.data.length / 4; // RGBA

  for (let i = 0; i < imgData1.data.length; i += 4) {
    const r1 = imgData1.data[i];
    const g1 = imgData1.data[i + 1];
    const b1 = imgData1.data[i + 2];
    
    const r2 = imgData2.data[i];
    const g2 = imgData2.data[i + 1];
    const b2 = imgData2.data[i + 2];
    
    // RGB distance
    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) + 
      Math.pow(g1 - g2, 2) + 
      Math.pow(b1 - b2, 2)
    );
    
    totalDiff += distance;
  }

  const avgDiff = totalDiff / pixelCount;
  // Normalize (max diff is sqrt(3 * 255^2) ≈ 441)
  const similarity = 1 - Math.min(1, avgDiff / 100);
  return similarity;
}

/**
 * Find best overlap position between two images
 * Returns the Y offset where images best overlap
 */
function findOverlap(bottomRegion, topRegion, maxOverlap = OVERLAP_PIXELS) {
  let bestOffset = 0;
  let bestSimilarity = 0;

  // Sample a horizontal band for comparison (middle 60% of width)
  const sampleWidth = Math.floor(bottomRegion.width * 0.6);
  const sampleX = Math.floor(bottomRegion.width * 0.2);

  const bottomSample = getImageData(
    bottomRegion.canvas,
    sampleX,
    bottomRegion.y - maxOverlap,
    sampleWidth,
    maxOverlap
  );

  // Try different offsets
  for (let offset = 10; offset <= maxOverlap; offset += 5) {
    const topSample = getImageData(
      topRegion.canvas,
      sampleX,
      topRegion.y,
      sampleWidth,
      offset
    );

    const similarity = compareImageRegions(
      getImageData(bottomRegion.canvas, sampleX, bottomRegion.y - offset, sampleWidth, offset),
      topSample
    );

    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestOffset = offset;
    }
  }

  // Only use overlap if similarity is high enough
  return bestSimilarity >= OVERLAP_THRESHOLD ? bestOffset : 0;
}

/**
 * Stitch frames together
 */
async function stitchFrames(frameDataUrls, options = {}) {
  if (frameDataUrls.length === 0) {
    throw new Error('No frames to stitch');
  }

  // Load all images
  const images = await Promise.all(frameDataUrls.map(loadImage));
  
  if (images.length === 1) {
    // Single frame - just return it
    const canvas = new OffscreenCanvas(images[0].width, images[0].height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(images[0], 0, 0);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const dataUrl = await blobToDataUrl(blob);
    
    return {
      pngDataUrl: dataUrl,
      width: images[0].width,
      height: images[0].height
    };
  }

  const firstImage = images[0];
  const imageWidth = firstImage.width;
  const cropTop = options.cropTop || 0;

  // Calculate total height (estimate)
  const firstFrameHeight = firstImage.height - cropTop;
  let estimatedHeight = firstFrameHeight;
  
  for (let i = 1; i < images.length; i++) {
    const frameHeight = images[i].height - cropTop;
    estimatedHeight += Math.max(0, frameHeight - OVERLAP_PIXELS);
  }

  // Create canvas for final composite
  const compositeCanvas = new OffscreenCanvas(imageWidth, estimatedHeight);
  const compositeCtx = compositeCanvas.getContext('2d');
  
  // Fill with white background
  compositeCtx.fillStyle = '#ffffff';
  compositeCtx.fillRect(0, 0, imageWidth, estimatedHeight);

  // Draw first frame (cropped if needed)
  let currentY = 0;
  compositeCtx.drawImage(
    firstImage,
    0, cropTop, // Source: crop from top
    imageWidth, firstImage.height - cropTop,
    0, currentY, // Destination
    imageWidth, firstImage.height - cropTop
  );

  currentY += firstFrameHeight;

  // Stitch remaining frames
  for (let i = 1; i < images.length; i++) {
    const currentImage = images[i];
    const frameHeight = currentImage.height - cropTop;

    // Create temporary canvas for current frame
    const frameCanvas = new OffscreenCanvas(imageWidth, frameHeight);
    const frameCtx = frameCanvas.getContext('2d');
    frameCtx.drawImage(
      currentImage,
      0, cropTop,
      imageWidth, frameHeight,
      0, 0,
      imageWidth, frameHeight
    );

    // Find overlap with previous frame
    const bottomRegion = {
      canvas: compositeCanvas,
      y: currentY - OVERLAP_PIXELS,
      width: imageWidth
    };
    
    const topRegion = {
      canvas: frameCanvas,
      y: 0,
      width: imageWidth
    };

    const overlap = findOverlap(bottomRegion, topRegion);
    const appendHeight = frameHeight - overlap;

    // Draw non-overlapping portion
    if (appendHeight > 0) {
      compositeCtx.drawImage(
        frameCanvas,
        0, overlap, // Source: skip overlapped top portion
        imageWidth, appendHeight,
        0, currentY - overlap, // Destination: overlap with previous
        imageWidth, appendHeight
      );
      
      currentY += appendHeight - overlap;
    }
  }

  // Crop canvas to actual content height
  const actualHeight = currentY;
  const finalCanvas = new OffscreenCanvas(imageWidth, actualHeight);
  const finalCtx = finalCanvas.getContext('2d');
  finalCtx.drawImage(compositeCanvas, 0, 0, imageWidth, actualHeight, 0, 0, imageWidth, actualHeight);

  // Convert to PNG blob
  const blob = await finalCanvas.convertToBlob({ type: 'image/png' });
  const dataUrl = await blobToDataUrl(blob);

  return {
    pngDataUrl: dataUrl,
    width: imageWidth,
    height: actualHeight
  };
}

/**
 * Convert blob to data URL
 */
function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Message listener for stitching requests
self.addEventListener('message', async (event) => {
  if (event.data.type === 'IGMETRYX_STITCH') {
    try {
      const result = await stitchFrames(event.data.frames, event.data.options);
      
      // Send result back to service worker
      self.postMessage({
        type: 'IGMETRYX_STITCH_RESULT',
        success: true,
        ...result
      });
    } catch (error) {
      self.postMessage({
        type: 'IGMETRYX_STITCH_RESULT',
        success: false,
        error: error.message
      });
    }
  }
});

// Handle service worker messages (offscreen can receive from SW)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'IGMETRYX_STITCH') {
    stitchFrames(message.frames, message.options)
      .then(result => {
        sendResponse({ success: true, ...result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Async response
  }
});



