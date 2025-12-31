/**
 * Canvas composition utilities for creating snapshot images
 */

export type LayoutType = 'grid' | 'vertical';
export type TileSize = 'small' | 'medium' | 'large';
export type BackgroundType = 'light' | 'dark';

export interface CompositionOptions {
  layout: LayoutType;
  columns: number;
  tileSize: TileSize;
  spacing: number;
  background: BackgroundType;
  watermark: boolean;
  blur: boolean;
  headerLine: boolean;
  headerLabel?: string;
}

const MAX_OUTPUT_WIDTH = 2400;
const MAX_VERTICAL_HEIGHT = 8000;

const TILE_SIZES: Record<TileSize, number> = {
  small: 300,
  medium: 400,
  large: 500,
};

/**
 * Draw full viewport image maintaining original dimensions
 * For GoFullPage-style vertical composition
 * Returns the height of the drawn image
 */
function drawViewportImage(
  ctx: CanvasRenderingContext2D,
  bitmap: ImageBitmap,
  targetWidth: number,
  x: number,
  y: number
): number {
  // Calculate scale to fit target width while maintaining aspect ratio
  const scale = targetWidth / bitmap.width;
  const scaledHeight = bitmap.height * scale;

  // Draw image at full width, maintaining aspect ratio
  ctx.drawImage(
    bitmap,
    0,
    0,
    bitmap.width,
    bitmap.height,
    x,
    y,
    targetWidth,
    scaledHeight
  );
  
  return scaledHeight;
}

/**
 * Compose snapshot from frames - GoFullPage style vertical composition
 */
export async function composeSnapshot(
  frames: Array<{ bitmap: ImageBitmap }>,
  options: CompositionOptions
): Promise<Blob> {
  if (frames.length < 1) {
    throw new Error('At least 1 frame is required to generate a snapshot.');
  }

  // For GoFullPage-style: always use vertical layout, full viewport width
  // Use the width of the first frame as the target width (all should be similar)
  const targetWidth = Math.min(frames[0].bitmap.width, MAX_OUTPUT_WIDTH);
  const spacing = options.spacing;

  // Calculate total height: sum of all frame heights + spacing between them
  let totalHeight = 0;
  const frameHeights: number[] = [];
  
  frames.forEach((frame) => {
    const scale = targetWidth / frame.bitmap.width;
    const scaledHeight = frame.bitmap.height * scale;
    frameHeights.push(scaledHeight);
    totalHeight += scaledHeight;
  });
  
  // Add spacing between frames (not before first or after last)
  totalHeight += spacing * (frames.length - 1);
  
  // Add header if enabled
  const headerHeight = options.headerLine ? 60 : 0;
  totalHeight += headerHeight;

  // Check if height exceeds limit - if so, we'll need to scale down
  let finalHeight = totalHeight;
  let finalWidth = targetWidth;
  let scaleFactor = 1;
  
  if (finalHeight > MAX_VERTICAL_HEIGHT) {
    scaleFactor = MAX_VERTICAL_HEIGHT / finalHeight;
    finalHeight = MAX_VERTICAL_HEIGHT;
    finalWidth = Math.floor(targetWidth * scaleFactor);
  }

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = finalWidth;
  canvas.height = finalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw background
  ctx.fillStyle = options.background === 'light' ? '#ffffff' : '#1a1a1a';
  ctx.fillRect(0, 0, finalWidth, finalHeight);

  // Draw header line if enabled
  let currentY = 0;
  if (options.headerLine && options.headerLabel) {
    const headerH = Math.floor(60 * scaleFactor);
    ctx.fillStyle = options.background === 'light' ? '#f3f4f6' : '#2a2a2a';
    ctx.fillRect(0, 0, finalWidth, headerH);

    ctx.fillStyle = options.background === 'light' ? '#374151' : '#e5e7eb';
    ctx.font = `${Math.floor(16 * scaleFactor)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    const date = new Date().toLocaleDateString();
    ctx.fillText(`${options.headerLabel} • ${date}`, Math.floor(16 * scaleFactor), headerH / 2);
    currentY = headerH;
  }

  // Draw each viewport frame vertically, one below the other
  frames.forEach((frame, index) => {
    const frameWidth = finalWidth;
    const frameHeight = Math.floor(frameHeights[index] * scaleFactor);
    const frameSpacing = index > 0 ? Math.floor(spacing * scaleFactor) : 0;
    
    currentY += frameSpacing;

    // Apply blur if enabled (very subtle)
    if (options.blur) {
      ctx.filter = 'blur(0.3px)';
    }

    // Draw viewport image at full width, maintaining aspect ratio
    const scale = frameWidth / frame.bitmap.width;
    const scaledHeight = frame.bitmap.height * scale;
    
    ctx.drawImage(
      frame.bitmap,
      0,
      0,
      frame.bitmap.width,
      frame.bitmap.height,
      0,
      currentY,
      frameWidth,
      scaledHeight
    );
    
    ctx.filter = 'none';
    currentY += scaledHeight;
  });

  // Draw watermark
  if (options.watermark) {
    ctx.fillStyle = options.background === 'light' ? '#9ca3af' : '#6b7280';
    ctx.font = `${Math.floor(12 * scaleFactor)}px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('IGMETRYX — reference only', finalWidth - Math.floor(16 * scaleFactor), finalHeight - Math.floor(16 * scaleFactor));
  }

  // Export as PNG
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error('Failed to export canvas as blob'));
      }
    }, 'image/png');
  });
}

/**
 * Download blob as PNG file
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

