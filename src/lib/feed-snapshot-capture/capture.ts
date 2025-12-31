/**
 * Screen capture utilities
 * Client-side only - uses browser Screen Share API
 */

export type CaptureStatus = 'idle' | 'capturing' | 'stopped';

export interface CapturedFrame {
  id: string;
  bitmap: ImageBitmap;
  thumbDataUrl: string;
  createdAt: number;
}

const MAX_FRAMES = 60;

/**
 * Start screen capture using getDisplayMedia
 */
export async function startCapture(
  videoElement: HTMLVideoElement
): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
    throw new Error('Screen capture is not supported in this browser. Please use a desktop browser.');
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: { ideal: 30, max: 60 },
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
    audio: false,
  });

  videoElement.srcObject = stream;
  
  // Wait for video to be ready
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Video loading timeout'));
    }, 5000);
    
    videoElement.onloadedmetadata = () => {
      clearTimeout(timeout);
      videoElement.play()
        .then(() => resolve())
        .catch(reject);
    };
    
    videoElement.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Video element error'));
    };
  });

  // Handle stream end (user stops sharing)
  stream.getVideoTracks()[0].addEventListener('ended', () => {
    stopCapture(stream);
  });

  return stream;
}

/**
 * Stop screen capture
 */
export function stopCapture(stream: MediaStream | null): void {
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
  }
}

/**
 * Capture a single frame from video element
 */
export async function captureFrame(
  videoElement: HTMLVideoElement,
  frames: CapturedFrame[]
): Promise<CapturedFrame | null> {
  if (frames.length >= MAX_FRAMES) {
    throw new Error(`Maximum ${MAX_FRAMES} frames reached.`);
  }

  // Wait for video to be ready
  if (videoElement.readyState < videoElement.HAVE_CURRENT_DATA) {
    // Wait a bit for video to load
    await new Promise(resolve => setTimeout(resolve, 100));
    if (videoElement.readyState < videoElement.HAVE_CURRENT_DATA) {
      return null;
    }
  }

  // Check if video has valid dimensions
  if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
    return null;
  }

  // Use regular Canvas instead of OffscreenCanvas for better browser support
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  try {
    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

    // Create full-size bitmap
    const bitmap = await createImageBitmap(canvas);

    // Create thumbnail (200x200 for preview)
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 200;
    thumbCanvas.height = 200;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (!thumbCtx) {
      bitmap.close();
      return null;
    }

    thumbCtx.drawImage(bitmap, 0, 0, 200, 200);
    
    // Use toDataURL for thumbnail (simpler and more compatible)
    const thumbDataUrl = thumbCanvas.toDataURL('image/png');

    return {
      id: `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      bitmap,
      thumbDataUrl,
      createdAt: Date.now(),
    };
  } catch (err) {
    console.error('Error capturing frame:', err);
    return null;
  }
}

/**
 * Dedupe frames by comparing pixel samples
 * Returns true if frames are similar (skip saving)
 */
export async function isDuplicateFrame(
  newFrame: CapturedFrame,
  lastFrame: CapturedFrame | null
): Promise<boolean> {
  if (!lastFrame) return false;

  // Compare small downscaled samples
  const sampleSize = 50;
  const canvas1 = document.createElement('canvas');
  canvas1.width = sampleSize;
  canvas1.height = sampleSize;
  const canvas2 = document.createElement('canvas');
  canvas2.width = sampleSize;
  canvas2.height = sampleSize;
  const ctx1 = canvas1.getContext('2d');
  const ctx2 = canvas2.getContext('2d');
  if (!ctx1 || !ctx2) return false;

  ctx1.drawImage(newFrame.bitmap, 0, 0, sampleSize, sampleSize);
  ctx2.drawImage(lastFrame.bitmap, 0, 0, sampleSize, sampleSize);

  const imgData1 = ctx1.getImageData(0, 0, sampleSize, sampleSize);
  const imgData2 = ctx2.getImageData(0, 0, sampleSize, sampleSize);

  // Compare pixel differences
  let diffCount = 0;
  const threshold = 10; // Color difference threshold
  const pixelCount = sampleSize * sampleSize;

  for (let i = 0; i < imgData1.data.length; i += 4) {
    const r1 = imgData1.data[i];
    const g1 = imgData1.data[i + 1];
    const b1 = imgData1.data[i + 2];
    const r2 = imgData2.data[i];
    const g2 = imgData2.data[i + 1];
    const b2 = imgData2.data[i + 2];

    const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2);
    if (diff > threshold) {
      diffCount++;
    }
  }

  // If less than 5% of pixels differ, consider it a duplicate
  return diffCount / pixelCount < 0.05;
}

/**
 * Remove a frame and clean up resources
 */
export function removeFrame(frame: CapturedFrame): void {
  frame.bitmap.close();
  URL.revokeObjectURL(frame.thumbDataUrl);
}

/**
 * Clear all frames
 */
export function clearAllFrames(frames: CapturedFrame[]): void {
  frames.forEach(removeFrame);
}

