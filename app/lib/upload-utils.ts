// This file contains utility functions for robust file uploading
// It's intended to be imported in actions.ts or other server-side code

import { uploadToS3, createSafariCompatibleFile } from '@/app/lib/s3';
import { logger } from '@/app/lib/logger';

/**
 * Process a base64 data URL into a buffer/array that works in both browser and server
 * environments
 * 
 * @param dataUrl A data URL string (e.g., "data:audio/webm;base64,...")
 * @returns A Uint8Array containing the decoded data
 */
export function processBase64DataUrl(dataUrl: string): Uint8Array {
  // Extract the base64 part
  const base64Data = dataUrl.split(',')[1];
  
  if (!base64Data) {
    throw new Error('Invalid data URL format: missing base64 data');
  }
  
  // Different handling for browser vs server
  if (typeof window !== 'undefined') {
    // Browser environment
    try {
      const binaryString = atob(base64Data);
      const byteArray = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        byteArray[i] = binaryString.charCodeAt(i);
      }
      return byteArray;
    } catch (error) {
      logger.error('Browser atob failed', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      // Fallback to Buffer in case we're in a Node.js environment
      return new Uint8Array(Buffer.from(base64Data, 'base64'));
    }
  } else {
    // Server environment
    return new Uint8Array(Buffer.from(base64Data, 'base64'));
  }
}

/**
 * Enhanced file upload function with better error handling and retries.
 * This function is safe to use in both client and server environments.
 * 
 * @param file The file to upload
 * @param folderPath The folder path within S3 (without trailing slash)
 * @param fileName Optional filename override, will use the file's name if not provided
 * @returns URL of the uploaded file
 */
export async function uploadFileToS3WithRetry(
  file: File,
  folderPath: string,
  fileName?: string
): Promise<string> {
  // First, check if we're in server environment to avoid using browser-only APIs
  if (typeof window === 'undefined') {
    logger.debug('Server-side upload detected - using direct S3 upload');
    
    // Generate a unique key for S3
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const finalFileName = fileName || file.name || `upload-${timestamp}.bin`;
    const key = `${folderPath}/${timestamp}-${randomSuffix}-${finalFileName}`;
    
    // Ensure file has a proper MIME type for server processing
    let safeMimeType = 'audio/webm';
    if (file.type && file.type !== '') {
      safeMimeType = file.type;
    } else if (finalFileName) {
      // Try to determine MIME type from extension
      if (finalFileName.endsWith('.mp3')) safeMimeType = 'audio/mpeg';
      else if (finalFileName.endsWith('.wav')) safeMimeType = 'audio/wav';
      else if (finalFileName.endsWith('.webm')) {
        safeMimeType = finalFileName.includes('video') || finalFileName.includes('vid') ? 'video/webm' : 'audio/webm';
      }
      else if (finalFileName.endsWith('.mp4')) {
        safeMimeType = finalFileName.includes('video') || finalFileName.includes('vid') ? 'video/mp4' : 'audio/mp4';
      }
      else if (finalFileName.endsWith('.mov')) safeMimeType = 'video/quicktime';
      else if (finalFileName.endsWith('.avi')) safeMimeType = 'video/x-msvideo';
    }
    logger.debug(`Server-side upload using MIME type: ${safeMimeType}`);
    
    // Create a file with proper MIME type if needed
    let fileToUpload = file;
    if (file.type !== safeMimeType) {
      try {
        // Try to create a new file with proper MIME type
        const arrayBuffer = await file.arrayBuffer();
        fileToUpload = new File([arrayBuffer], finalFileName, { 
          type: safeMimeType,
          lastModified: Date.now()
        });
        logger.debug('Created file with corrected MIME type for server upload');
      } catch (error) {
        logger.warn('Could not create file with corrected MIME type', { metadata: { error: error instanceof Error ? error.message : String(error) } });
        // Continue with original file
      }
    }
    
    // Upload directly without browser-specific processing
    try {
      const url = await uploadToS3(fileToUpload, key);
      if (typeof url !== 'string') {
        throw new Error('Upload failed: Invalid URL returned');
      }
      logger.debug(`Server upload successful with MIME type ${fileToUpload.type}:`, { metadata: { url: url } });
      return url;
    } catch (error) {
      logger.error('Server-side S3 upload failed', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  // Client-side upload with retries
  try {
    // Prepare the file with Safari compatibility fixes
    const safeFile = await createSafariCompatibleFile(file);
    
    // Verify MIME type and correct if needed
    let fileToUpload = safeFile;
    if (!safeFile.type || safeFile.type === '') {
      // Try to determine MIME type from extension
      let safeMimeType = 'audio/webm'; // Default
      const filename = safeFile.name || '';
      
      if (filename.endsWith('.mp3')) safeMimeType = 'audio/mpeg';
      else if (filename.endsWith('.wav')) safeMimeType = 'audio/wav';
      else if (filename.endsWith('.webm')) {
        safeMimeType = filename.includes('video') || filename.includes('vid') ? 'video/webm' : 'audio/webm';
      }
      else if (filename.endsWith('.mp4')) {
        safeMimeType = filename.includes('video') || filename.includes('vid') ? 'video/mp4' : 'audio/mp4';
      }
      else if (filename.endsWith('.mov')) safeMimeType = 'video/quicktime';
      else if (filename.endsWith('.avi')) safeMimeType = 'video/x-msvideo';
      
      // Create a new file with the proper MIME type
      try {
        const arrayBuffer = await safeFile.arrayBuffer();
        fileToUpload = new File([arrayBuffer], safeFile.name, {
          type: safeMimeType,
          lastModified: safeFile.lastModified || Date.now()
        });
        logger.debug(`Fixed MIME type to ${safeMimeType} for upload`);
      } catch (error) {
        logger.warn('Could not create file with corrected MIME type', { metadata: { error: error instanceof Error ? error.message : String(error) } });
        // Continue with original file
      }
    }
    
    // Generate a unique key for S3
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const finalFileName = fileName || fileToUpload.name;
    const key = `${folderPath}/${timestamp}-${randomSuffix}-${finalFileName}`;
    logger.debug(`Client-side upload using MIME type: ${fileToUpload.type}`);
    
    // Try to upload with retries
    let lastError: Error | undefined;
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
      try {
        logger.debug(`S3 upload attempt ${retries + 1} for ${key}, MIME type: ${fileToUpload.type}`);
        const url = await uploadToS3(fileToUpload, key);
        if (typeof url !== 'string') {
          throw new Error('Upload failed: Invalid URL returned');
        }
        logger.debug(`S3 upload successful: ${url}`);
        return url;
      } catch (error) {
        retries++;
        lastError = error instanceof Error ? error : new Error(String(error));
        logger.error(`S3 upload attempt ${retries} failed:`, error);
        
        // If we have retries left, wait before trying again
        if (retries < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, retries); // Exponential backoff
          logger.debug(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we reached here, all retries failed
    throw new Error(`Failed to upload file after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  } catch (error) {
    logger.error('Error in upload process', { metadata: { error: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}
