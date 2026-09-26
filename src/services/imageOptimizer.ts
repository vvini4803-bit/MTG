// Client-side image compression & thumbnail generator with universal fallbacks
export const compressImage = (
  file: File,
  maxWidth = 400,
  maxHeight = 400,
  quality = 0.82
): Promise<{ dataUrl: string; sizeBytes: number }> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided.'));
    }

    const isImage =
      !file.type ||
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|bmp|heic|svg)$/i.test(file.name || '');

    if (!isImage) {
      return reject(new Error('Invalid file type. Please choose a valid photo image (JPG, PNG, WebP).'));
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) {
        return reject(new Error('Could not read file data.'));
      }

      // If already a tiny SVG or small format, return directly
      if (file.type === 'image/svg+xml' || (file.size && file.size < 15000)) {
        return resolve({ dataUrl: rawDataUrl, sizeBytes: file.size });
      }

      const img = new Image();
      img.onload = () => {
        try {
          let width = img.width || 400;
          let height = img.height || 400;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback to raw data url if canvas context cannot be initialized
            return resolve({ dataUrl: rawDataUrl, sizeBytes: file.size });
          }

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          const head = 'data:image/jpeg;base64,';
          const sizeBytes = Math.round(((compressedDataUrl.length - head.length) * 3) / 4);

          resolve({
            dataUrl: compressedDataUrl,
            sizeBytes
          });
        } catch {
          // If canvas processing throws on mobile/unsupported format, gracefully fallback to raw data
          resolve({
            dataUrl: rawDataUrl,
            sizeBytes: file.size
          });
        }
      };

      img.onerror = () => {
        // Fallback to raw data url if Image loading had issues
        resolve({
          dataUrl: rawDataUrl,
          sizeBytes: file.size
        });
      };

      img.src = rawDataUrl;
    };

    reader.onerror = (err) => {
      reject(err || new Error('Failed to read file from storage.'));
    };

    reader.readAsDataURL(file);
  });
};
