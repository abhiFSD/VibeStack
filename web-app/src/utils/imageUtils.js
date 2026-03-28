/**
 * Utility functions for image processing
 */

/**
 * Compresses and resizes an image file
 * @param {File} file - The original image file
 * @param {Object} options - Compression options
 * @param {number} options.quality - Quality of the resulting image (0-1), default 0.2 (80% reduction)
 * @param {number} options.maxWidth - Maximum width in pixels, default 1200
 * @param {number} options.maxHeight - Maximum height in pixels, default 1200
 * @returns {Promise<File>} - A promise that resolves with the compressed image as a File object
 */
export const compressImage = (file, options = {}) => {
  return new Promise((resolve, reject) => {
    // Default options
    const quality = options.quality || 0.2; // 80% reduction in quality
    const maxWidth = options.maxWidth || 1200;
    const maxHeight = options.maxHeight || 1200;
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      // Not an image, return the original file
      resolve(file);
      return;
    }
    
    // Skip SVG files as they're already small and vector-based
    if (file.type === 'image/svg+xml') {
      resolve(file);
      return;
    }

    // Create file reader to load the image
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round(height * (maxWidth / width));
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = Math.round(width * (maxHeight / height));
          height = maxHeight;
        }
        
        // Create canvas for the resized image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw the image on the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert canvas to blob with reduced quality
        canvas.toBlob(
          (blob) => {
            // Create a new file from the blob
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            });
            
            console.log(`Image compressed: ${(file.size / 1024).toFixed(2)}KB -> ${(compressedFile.size / 1024).toFixed(2)}KB`);
            resolve(compressedFile);
          },
          file.type,
          quality
        );
      };
      
      img.onerror = (error) => {
        // If there's an error loading the image, use the original file
        console.error('Error compressing image:', error);
        resolve(file);
      };
    };
    
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      reject(error);
    };
  });
};

/**
 * Batch compress multiple image files
 * @param {File[]} files - Array of image files to compress
 * @param {Object} options - Compression options
 * @returns {Promise<File[]>} - A promise that resolves with an array of compressed files
 */
export const batchCompressImages = async (files, options = {}) => {
  const compressedFiles = [];
  
  for (const file of files) {
    try {
      const compressedFile = await compressImage(file, options);
      compressedFiles.push(compressedFile);
    } catch (error) {
      console.error('Error compressing file:', file.name, error);
      // Add the original file if compression fails
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
}; 