import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';

// Clean up AWS credentials from any comments or extra whitespace
const cleanAccessKeyId = process.env.AWS_ACCESS_KEY_ID!.split('#')[0].trim();
const cleanSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!.split('#')[0].trim();


// Create S3 client with cleaned credentials
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: cleanAccessKeyId,
    secretAccessKey: cleanSecretAccessKey,
  },
  // Add retry configuration for better error handling
  retryMode: 'standard',
  maxAttempts: 3,
});

export async function uploadToS3(file: File, key: string) {
  console.log('Starting S3 upload for:', key);
  
  try {
    // Get file data with error handling for Safari
    let fileBuffer;
    try {
      // Convert ArrayBuffer to Uint8Array for S3 compatibility
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = new Uint8Array(arrayBuffer);
    } catch (arrayBufferError) {
      console.warn('Error getting arrayBuffer:', arrayBufferError);
      
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
                else if (key.endsWith('.webm')) contentType = 'audio/webm';
                else if (key.endsWith('.mp4')) contentType = 'video/mp4';
                else if (key.endsWith('.m4a')) contentType = 'audio/mp4';
                // Default to webm for audio content
                else contentType = 'audio/webm';
              }
              
              console.log(`S3 upload (FileReader method) using content type: ${contentType} for key: ${key}`);
              
              const command = new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                Body: uint8Array,
                ContentType: contentType,
              });
              
              await s3Client.send(command);
              const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
              console.log('S3 upload successful (FileReader method):', url);
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
          console.log('Attempting server-side file reading');
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
            console.error('Unable to read file using standard methods');
            throw new Error('Unable to read file data in server environment');
          }
        } catch (nodeError) {
          console.error('Server-side file processing failed:', nodeError);
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
      else if (key.endsWith('.webm')) contentType = 'audio/webm';
      else if (key.endsWith('.mp4')) contentType = 'video/mp4';
      else if (key.endsWith('.m4a')) contentType = 'audio/mp4';
      // Default to webm for audio content
      else contentType = 'audio/webm';
    }
    
    console.log(`S3 upload using content type: ${contentType} for key: ${key}`);
    
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: contentType,
    });

    await s3Client.send(command);
    const url = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
    console.log('S3 upload successful:', url);
    return url;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}

export async function getSignedUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  return await s3GetSignedUrl(s3Client, command, { expiresIn: 3600 });
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
    console.error('Error creating Safari-compatible file:', error);
    // Return the original file as fallback
    return file;
  }
}