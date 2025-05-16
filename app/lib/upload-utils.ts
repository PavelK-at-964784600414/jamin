// This file contains utility functions for robust file uploading
// It's intended to be imported in actions.ts or other server-side code

import { uploadToS3, createSafariCompatibleFile } from '@/app/lib/s3';

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
      console.error('Browser atob failed:', error);
      // Fallback to Buffer in case we're in a Node.js environment
      return new Uint8Array(Buffer.from(base64Data, 'base64'));
    }
  } else {
    // Server environment
    return new Uint8Array(Buffer.from(base64Data, 'base64'));
  }
}

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
      console.error('Browser atob failed:', error);
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
    console.log('Server-side upload detected - using direct S3 upload');
    
    // Generate a unique key for S3
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const finalFileName = fileName || file.name || `upload-${timestamp}.bin`;
    const key = `${folderPath}/${timestamp}-${randomSuffix}-${finalFileName}`;
    
    // Upload directly without browser-specific processing
    try {
      return await uploadToS3(file, key);
    } catch (error: any) {
      console.error('Server-side S3 upload failed:', error);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }
  
  // Client-side upload with retries
  try {
    // Prepare the file with Safari compatibility fixes
    const safeFile = await createSafariCompatibleFile(file);
    
    // Generate a unique key for S3
    const timestamp = Date.now();
    const randomSuffix = Math.floor(Math.random() * 10000);
    const finalFileName = fileName || safeFile.name;
    const key = `${folderPath}/${timestamp}-${randomSuffix}-${finalFileName}`;
    
    // Try to upload with retries
    let lastError: Error | undefined;
    let retries = 0;
    const MAX_RETRIES = 3;
    
    while (retries < MAX_RETRIES) {
      try {
        console.log(`S3 upload attempt ${retries + 1} for ${key}`);
        const url = await uploadToS3(safeFile, key);
        console.log(`S3 upload successful: ${url}`);
        return url;
      } catch (error) {
        retries++;
        lastError = error as Error;
        console.error(`S3 upload attempt ${retries} failed:`, error);
        
        // If we have retries left, wait before trying again
        if (retries < MAX_RETRIES) {
          const delay = 1000 * Math.pow(2, retries); // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we reached here, all retries failed
    throw new Error(`Failed to upload file after ${MAX_RETRIES} attempts: ${lastError?.message}`);
  } catch (error) {
    console.error('Error in upload process:', error);
    throw error;
  }
}
