/**
 * Client-side image compression utility
 * Reduces image size before upload
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;
const WEBP_QUALITY = 0.85;

export interface CompressedImage {
  file: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress a single image
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  const originalSize = file.size;
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width > height) {
            height = (height / width) * MAX_DIMENSION;
            width = MAX_DIMENSION;
          } else {
            width = (width / height) * MAX_DIMENSION;
            height = MAX_DIMENSION;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            // Create new file
            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: blob.type || 'image/jpeg',
                lastModified: Date.now(),
              }
            );
            
            const compressedSize = compressedFile.size;
            const compressionRatio = ((1 - compressedSize / originalSize) * 100);
            
            console.log(`[Image Compressor] Compressed ${file.name}: ${originalSize} → ${compressedSize} bytes (${compressionRatio.toFixed(1)}% reduction)`);
            
            resolve({
              file: compressedFile,
              originalSize,
              compressedSize,
              compressionRatio,
            });
          },
          'image/jpeg',
          JPEG_QUALITY
        );
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images in parallel (with concurrency limit)
 */
export async function compressImages(
  files: File[],
  maxConcurrency: number = 3
): Promise<CompressedImage[]> {
  const results: CompressedImage[] = [];
  
  // Process in batches
  for (let i = 0; i < files.length; i += maxConcurrency) {
    const batch = files.slice(i, i + maxConcurrency);
    const batchResults = await Promise.all(
      batch.map(file => compressImage(file))
    );
    results.push(...batchResults);
  }
  
  const totalOriginal = results.reduce((sum, r) => sum + r.originalSize, 0);
  const totalCompressed = results.reduce((sum, r) => sum + r.compressedSize, 0);
  const totalReduction = ((1 - totalCompressed / totalOriginal) * 100).toFixed(1);
  
  console.log(`[Image Compressor] Compressed ${files.length} images: ${totalOriginal} → ${totalCompressed} bytes (${totalReduction}% reduction)`);
  
  return results;
}


