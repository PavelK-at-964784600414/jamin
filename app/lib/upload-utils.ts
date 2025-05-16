// This file contains utility functions for robust file uploading
// It's intended to be imported in actions.ts or other server-side code

import { uploadToS3, createSafariCompatibleFile } from '@/app/lib/s3';

/**
 * Enhanced file upload function with better error handling and retries
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
}
