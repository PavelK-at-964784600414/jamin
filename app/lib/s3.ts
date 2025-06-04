// Dynamic imports for AWS SDK to reduce bundle size
// import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
// import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger';

// Lazy load AWS SDK components
let S3Client: any, PutObjectCommand: any, GetObjectCommand: any, getSignedUrl: any;

const loadAWSSDK = async () => {
  if (!S3Client) {
    const [clientS3, presigner] = await Promise.all([
      import('@aws-sdk/client-s3'),
      import('@aws-sdk/s3-request-presigner')
    ]);
    S3Client = clientS3.S3Client;
    PutObjectCommand = clientS3.PutObjectCommand;
    GetObjectCommand = clientS3.GetObjectCommand;
    getSignedUrl = presigner.getSignedUrl;
  }
  return { S3Client, PutObjectCommand, GetObjectCommand, getSignedUrl };
};

// Clean up AWS credentials from any comments or extra whitespace
// Check that required environment variables exist
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error('Missing required AWS environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION');
}

// @ts-ignore - TypeScript strictness issue with process.env after null check
const cleanAccessKeyId = process.env.AWS_ACCESS_KEY_ID.split('#')[0].trim();
// @ts-ignore - TypeScript strictness issue with process.env after null check  
const cleanSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY.split('#')[0].trim();
// @ts-ignore - TypeScript strictness issue with process.env after null check
const region = process.env.AWS_REGION;


// Create S3 client factory function
let s3ClientInstance: any = null;

const getS3Client = async () => {
  if (!s3ClientInstance) {
    const { S3Client } = await loadAWSSDK();
    s3ClientInstance = new S3Client({
      region: region,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
      // Add retry configuration for better error handling
      retryMode: 'standard',
      maxAttempts: 3,
    });
  }
  return s3ClientInstance;
};

export async function uploadToS3(file: File, key: string) {
  logger.debug('Starting S3 upload for', { metadata: { data: key } });
  
  // Load AWS SDK dynamically
  const { PutObjectCommand } = await loadAWSSDK();
  const s3Client = await getS3Client();
  
  try {
    // Get file data with error handling for Safari
    let fileBuffer;
    try {
      // Convert ArrayBuffer to Uint8Array for S3 compatibility
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = new Uint8Array(arrayBuffer);
    } catch (arrayBufferError) {
      logger.warn('Error getting arrayBuffer', { metadata: { data: arrayBufferError } });
      
      // Check if we're in a browser environment where FileReader is available
      if (typeof window !== 'undefined' && typeof FileReader !== 'undefined') {
        // Browser-specific code using FileReader
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const arrayBuffer = event.target?.result as ArrayBuffer;
              if (!arrayBuffer) {
                throw new Error('FileReader did not produce a result');
              }
              
              // Convert to Uint8Array for S3
              const uint8Array = new Uint8Array(arrayBuffer);
              
              // Determine a safe and appropriate MIME type
              let contentType = file.type || 'audio/webm';
              
              // Try to infer MIME type from the key/filename if not provided by the file
              if (!contentType || contentType === '') {
                if (key.endsWith('.mp3')) contentType = 'audio/mpeg';
                else if (key.endsWith('.wav')) contentType = 'audio/wav';
                else if (key.endsWith('.webm')) {
                  contentType = key.includes('video') || key.includes('vid') ? 'video/webm' : 'audio/webm';
                }
                else if (key.endsWith('.mp4')) {
                  contentType = key.includes('video') || key.includes('vid') ? 'video/mp4' : 'audio/mp4';
                }
                else if (key.endsWith('.m4a')) contentType = 'audio/mp4';
                else if (key.endsWith('.mov')) contentType = 'video/quicktime';
                else if (key.endsWith('.avi')) contentType = 'video/x-msvideo';
                // Default to webm for audio content
                else contentType = 'audio/webm';
              }
              
              logger.s3.debug(`S3 upload (FileReader method) using content type: ${contentType} for key: ${key}`);
              
              const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: uint8Array,
                ContentType: contentType,
              });
              
              await s3Client.send(command);
              const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
              logger.debug('S3 upload successful (FileReader method)', { metadata: { data: url } });
              resolve(url);
            } catch (uploadError) {
              reject(uploadError);
            }
          };
          reader.onerror = () => reject(new Error('FileReader failed'));
          reader.readAsArrayBuffer(file);
        });
      } else {
        // Server-side code - Attempt different approach for Node.js
        try {
          // Try to get buffer from Node.js specific methods
          logger.debug('Attempting server-side file reading');
          if ('buffer' in file && typeof file.buffer === 'function') {
            const buffer = await file.buffer();
            fileBuffer = new Uint8Array(buffer);
          } else if ('stream' in file && typeof file.stream === 'function') {
            // Handle stream-based files
            const chunks: Uint8Array[] = [];
            const reader = file.stream().getReader();
            
            let done = false;
            while (!done) {
              const { done: readerDone, value } = await reader.read();
              if (readerDone) {
                done = true;
              } else if (value) {
                chunks.push(value);
              }
            }
            
            // Combine all chunks
            const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
            fileBuffer = new Uint8Array(totalLength);
            let offset = 0;
            for (const chunk of chunks) {
              fileBuffer.set(chunk, offset);
              offset += chunk.length;
            }
          } else {
            // Emergency fallback
            logger.error('Unable to read file using standard methods');
            throw new Error('Unable to read file data in server environment');
          }
        } catch (nodeError) {
          logger.error('Server-side file processing failed', { metadata: { error: nodeError instanceof Error ? nodeError.message : String(nodeError) } });
          throw nodeError;
        }
      }
    }
    
    // Standard upload path
    // Determine a safe and appropriate MIME type
    let contentType = file.type || 'audio/webm';
    
    // Try to infer MIME type from the key/filename if not provided by the file
    if (!contentType || contentType === '') {
      if (key.endsWith('.mp3')) contentType = 'audio/mpeg';
      else if (key.endsWith('.wav')) contentType = 'audio/wav';
      else if (key.endsWith('.webm')) {
        contentType = key.includes('video') || key.includes('vid') ? 'video/webm' : 'audio/webm';
      }
      else if (key.endsWith('.mp4')) {
        contentType = key.includes('video') || key.includes('vid') ? 'video/mp4' : 'audio/mp4';
      }
      else if (key.endsWith('.m4a')) contentType = 'audio/mp4';
      else if (key.endsWith('.mov')) contentType = 'video/quicktime';
      else if (key.endsWith('.avi')) contentType = 'video/x-msvideo';
      // Default to webm for audio content
      else contentType = 'audio/webm';
    }
    
    logger.s3.debug(`S3 upload using content type: ${contentType} for key: ${key}`);
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    logger.debug('S3 upload successful', { metadata: { data: url } });
    return url;
  } catch (error) {
    logger.error('Error uploading to S3', { metadata: { error: error instanceof Error ? error.message : String(error) } });
    throw error;
  }
}

export async function generateSignedUrl(key: string) {
  // Load AWS SDK dynamically
  const { GetObjectCommand, getSignedUrl } = await loadAWSSDK();
  const s3Client = await getS3Client();
  
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  // Using getSignedUrl from the AWS SDK v3
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Create a Safari-compatible File object from an existing file
 * This works around Safari's readonly property issues when working with File objects
 */
export async function createSafariCompatibleFile(file: File): Promise<File> {
  try {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined') {
      // Browser-safe approach: Create a new Blob from the file
      const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
      
      // Create a new File with a fixed MIME type for Safari compatibility
      const safeMimeType = file.type || 
        (file.name.endsWith('.mp3') ? 'audio/mpeg' : 
        (file.name.endsWith('.webm') ? 'audio/webm' : 
        'application/octet-stream'));
      
      // Return a new File object with the same content but properly sanitized
      return new File([fileBlob], file.name, { 
        type: safeMimeType,
        lastModified: file.lastModified 
      });
    } else {
      // Server-side approach: Just return the file as-is, since we can't use browser APIs
      // The uploadToS3 function will handle server-side processing
      return file;
    }
  } catch (error) {
    logger.error('Error creating Safari-compatible file', { metadata: { error: error instanceof Error ? error.message : String(error) } });
    // Return the original file as fallback
    return file;
  }
}