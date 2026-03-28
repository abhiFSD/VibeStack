import { Storage } from 'aws-amplify';
import { compressImage } from '../../utils/imageUtils';

export const handleFileInputClick = async (
  setUploading,
  setAttachments,
  setAttachmentURLs
) => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '*/*';

    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) {
        resolve([]);
        return;
      }

      setUploading(true);
      const uploadedKeys = [];
      const uploadedUrls = [];

      try {
        for (const file of files) {
          // Compress the image if it's an image file, otherwise use the original
          const processedFile = file.type.startsWith('image/') 
            ? await compressImage(file) 
            : file;
            
          const key = `attachments/${Date.now()}-${file.name}`;
          await Storage.put(key, processedFile, {
            contentType: file.type,
          });
          uploadedKeys.push(key);
          const url = await Storage.get(key);
          uploadedUrls.push(url);
        }

        setAttachments(prev => [...prev, ...uploadedKeys]);
        setAttachmentURLs(prev => [...prev, ...uploadedUrls]);
        resolve(uploadedKeys);
      } catch (error) {
        console.error('Error uploading files:', error);
        resolve([]);
      } finally {
        setUploading(false);
      }
    };

    input.click();
  });
}; 