/**
 * Thumbnail Generator Utility
 * Uses Canvas API to generate 300x200px thumbnails with 0.8 JPEG quality
 */

export interface ThumbnailOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

const DEFAULT_OPTIONS: Required<ThumbnailOptions> = {
  width: 300,
  height: 200,
  quality: 0.8,
  format: 'jpeg'
};

/**
 * Generate thumbnail from image file
 */
export const generateImageThumbnail = async (
  file: File,
  options: ThumbnailOptions = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      try {
        // Set canvas dimensions
        canvas.width = opts.width;
        canvas.height = opts.height;
        
        // Calculate aspect ratio and positioning
        const imgAspect = img.width / img.height;
        const canvasAspect = opts.width / opts.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (imgAspect > canvasAspect) {
          // Image is wider - fit by height
          drawHeight = opts.height;
          drawWidth = drawHeight * imgAspect;
          offsetX = (opts.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Image is taller - fit by width
          drawWidth = opts.width;
          drawHeight = drawWidth / imgAspect;
          offsetX = 0;
          offsetY = (opts.height - drawHeight) / 2;
        }
        
        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, opts.width, opts.height);
        
        // Draw image centered and scaled
        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert to base64
        const mimeType = `image/${opts.format}`;
        const thumbnail = canvas.toDataURL(mimeType, opts.quality);
        
        resolve(thumbnail);
      } catch (error) {
        reject(new Error(`Failed to generate thumbnail: ${error}`));
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail generation'));
    };
    
    // Create object URL and load image
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Cleanup object URL after loading
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      img.onload(); // Call original onload
    };
  });
};

/**
 * Generate thumbnail from video file
 */
export const generateVideoThumbnail = async (
  file: File,
  options: ThumbnailOptions = {},
  seekTime: number = 1
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    video.onloadedmetadata = () => {
      // Set seek time (but not beyond video duration)
      video.currentTime = Math.min(seekTime, video.duration);
    };
    
    video.onseeked = () => {
      try {
        // Set canvas dimensions
        canvas.width = opts.width;
        canvas.height = opts.height;
        
        // Calculate aspect ratio and positioning
        const videoAspect = video.videoWidth / video.videoHeight;
        const canvasAspect = opts.width / opts.height;
        
        let drawWidth, drawHeight, offsetX, offsetY;
        
        if (videoAspect > canvasAspect) {
          // Video is wider - fit by height
          drawHeight = opts.height;
          drawWidth = drawHeight * videoAspect;
          offsetX = (opts.width - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Video is taller - fit by width
          drawWidth = opts.width;
          drawHeight = drawWidth / videoAspect;
          offsetX = 0;
          offsetY = (opts.height - drawHeight) / 2;
        }
        
        // Fill background with black
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, opts.width, opts.height);
        
        // Draw video frame centered and scaled
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
        
        // Convert to base64
        const mimeType = `image/${opts.format}`;
        const thumbnail = canvas.toDataURL(mimeType, opts.quality);
        
        // Cleanup
        URL.revokeObjectURL(video.src);
        
        resolve(thumbnail);
      } catch (error) {
        reject(new Error(`Failed to generate video thumbnail: ${error}`));
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video for thumbnail generation'));
    };
    
    // Load video
    video.src = URL.createObjectURL(file);
    video.load();
  });
};

/**
 * Generate thumbnail from any supported media file
 */
export const generateThumbnail = async (
  file: File,
  options: ThumbnailOptions = {}
): Promise<string> => {
  const fileType = file.type.toLowerCase();
  
  if (fileType.startsWith('image/')) {
    return generateImageThumbnail(file, options);
  } else if (fileType.startsWith('video/')) {
    return generateVideoThumbnail(file, options);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }
};

/**
 * Validate file type and size
 */
export const validateMediaFile = (
  file: File,
  config: {
    maxSize: number;
    supportedTypes: string[];
  }
): { isValid: boolean; error?: string } => {
  // Check file size
  if (file.size > config.maxSize) {
    const maxSizeMB = (config.maxSize / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }
  
  // Check file type
  if (!config.supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported file type: ${file.type}`
    };
  }
  
  return { isValid: true };
};

/**
 * Get storage quota information
 */
export const getStorageQuota = async (): Promise<{
  used: number;
  available: number;
  total: number;
  percentage: number;
}> => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage || 0;
      const total = estimate.quota || 0;
      const available = total - used;
      const percentage = total > 0 ? (used / total) * 100 : 0;
      
      return { used, available, total, percentage };
    } catch (error) {
      console.warn('Failed to get storage estimate:', error);
    }
  }
  
  // Fallback values
  return {
    used: 0,
    available: 0,
    total: 0,
    percentage: 0
  };
};

/**
 * Compress image if it exceeds size limit
 */
export const compressImage = async (
  file: File,
  maxSizeBytes: number,
  initialQuality: number = 0.8
): Promise<File> => {
  if (file.size <= maxSizeBytes) {
    return file;
  }
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      let quality = initialQuality;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            
            if (blob.size <= maxSizeBytes || quality <= 0.1) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: file.lastModified
              });
              resolve(compressedFile);
            } else {
              quality -= 0.1;
              tryCompress();
            }
          },
          file.type,
          quality
        );
      };
      
      tryCompress();
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    
    img.src = URL.createObjectURL(file);
  });
};