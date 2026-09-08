// Client-side image compression & thumbnail generator
export const compressImage = (
  file: File,
  maxWidth = 1200,
  maxHeight = 900,
  quality = 0.8
): Promise<{ dataUrl: string; sizeBytes: number }> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Invalid file type. Only image files are permitted.'));
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

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
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        const head = 'data:image/jpeg;base64,';
        const sizeBytes = Math.round(((compressedDataUrl.length - head.length) * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          sizeBytes
        });
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};
