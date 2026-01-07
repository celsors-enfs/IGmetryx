/**
 * Image preprocessing utility
 * Resizes and compresses images before analysis
 */

import sharp from 'sharp';

export interface ProcessedImage {
  buffer: Buffer;
  mimetype: string;
  originalSize: number;
  processedSize: number;
}

const MAX_DIMENSION = 1280;
const JPEG_QUALITY = 75;
const WEBP_QUALITY = 80;

/**
 * Process a single image: resize and compress
 */
export async function processImage(
  imageBuffer: Buffer,
  mimetype: string,
  maxDimension: number = MAX_DIMENSION
): Promise<ProcessedImage> {
  const originalSize = imageBuffer.length;
  
  try {
    let image = sharp(imageBuffer);
    const metadata = await image.metadata();
    
    // Determine if resize is needed
    const needsResize = 
      (metadata.width && metadata.width > maxDimension) ||
      (metadata.height && metadata.height > maxDimension);
    
    if (needsResize) {
      image = image.resize(maxDimension, maxDimension, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }
    
    // Convert to JPEG for consistency and compression
    // Use WebP if supported, otherwise JPEG
    let processedBuffer: Buffer;
    let outputMimetype = mimetype;
    
    try {
      // Try WebP first (better compression)
      processedBuffer = await image
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      outputMimetype = 'image/webp';
    } catch {
      // Fallback to JPEG
      processedBuffer = await image
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();
      outputMimetype = 'image/jpeg';
    }
    
    const processedSize = processedBuffer.length;
    const compressionRatio = ((1 - processedSize / originalSize) * 100).toFixed(1);
    
    console.log(`[Image Preprocessor] Processed image: ${originalSize} → ${processedSize} bytes (${compressionRatio}% reduction)`);
    
    return {
      buffer: processedBuffer,
      mimetype: outputMimetype,
      originalSize,
      processedSize,
    };
  } catch (error: any) {
    console.error('[Image Preprocessor] Error processing image:', error.message);
    // Return original if processing fails
    return {
      buffer: imageBuffer,
      mimetype,
      originalSize,
      processedSize: originalSize,
    };
  }
}

/**
 * Process multiple images in parallel (with concurrency limit)
 */
export async function processImages(
  images: Array<{ buffer: Buffer; mimetype: string }>,
  maxConcurrency: number = 3
): Promise<ProcessedImage[]> {
  const results: ProcessedImage[] = [];
  
  // Process in batches to avoid overwhelming the system
  for (let i = 0; i < images.length; i += maxConcurrency) {
    const batch = images.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(
      batch.map(img => processImage(img.buffer, img.mimetype))
    );
    results.push(...batchResults);
  }
  
  const totalOriginal = images.reduce((sum, img) => sum + img.buffer.length, 0);
  const totalProcessed = results.reduce((sum, img) => sum + img.processedSize, 0);
  const totalReduction = ((1 - totalProcessed / totalOriginal) * 100).toFixed(1);
  
  console.log(`[Image Preprocessor] Processed ${images.length} images: ${totalOriginal} → ${totalProcessed} bytes (${totalReduction}% reduction)`);
  
  return results;
}


