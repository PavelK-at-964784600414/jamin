import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Helper function to ensure environment variables are properly loaded and trimmed
function getEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing environment variable: ${name}`);
    throw new Error(`Required environment variable ${name} is missing`);
  }
  return value.trim();
}

// Create S3 client with improved error handling
const s3Client = new S3Client({
  region: getEnvVar('AWS_REGION'),
  credentials: {
    accessKeyId: getEnvVar('AWS_ACCESS_KEY_ID'),
    secretAccessKey: getEnvVar('AWS_SECRET_ACCESS_KEY'),
  },
  // Add retry configuration for better reliability
  maxAttempts: 3,
});

// Log a sanitized version of credentials for debugging
console.log('S3 Client initialized with:');
console.log(`- Region: ${getEnvVar('AWS_REGION')}`);
console.log(`- Access Key ID: ${getEnvVar('AWS_ACCESS_KEY_ID').substring(0, 4)}...${getEnvVar('AWS_ACCESS_KEY_ID').slice(-4)}`);
console.log(`- Bucket: ${getEnvVar('AWS_BUCKET_NAME')}`);

/**
 * Upload a file to AWS S3 with enhanced error handling
 * @param file The file to upload
 * @param key The S3 object key
 * @returns The URL of the uploaded file
 */
export async function uploadToS3(file: File, key: string): Promise<string> {
  console.log('Starting S3 upload for:', key);
  
  try {
    // Get file data with error handling for Safari
    let fileBuffer: Uint8Array;
    
    try {
      // Convert ArrayBuffer to Uint8Array for S3 compatibility
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = new Uint8Array(arrayBuffer);
    } catch (arrayBufferError) {
      console.warn('Error getting arrayBuffer, trying alternative approach:', arrayBufferError);
      
      // Alternative approach for Safari
      fileBuffer = await new Promise<Uint8Array>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            if (!arrayBuffer) {
              reject(new Error('FileReader did not produce a result'));
              return;
            }
            
            // Convert to Uint8Array for S3
            const uint8Array = new Uint8Array(arrayBuffer);
            resolve(uint8Array);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsArrayBuffer(file);
      });
    }
    
    // Standard upload path
    const command = new PutObjectCommand({
      Bucket: getEnvVar('AWS_BUCKET_NAME'),
      Key: key,
      Body: fileBuffer,
      ContentType: file.type || 'audio/webm',
    });

    await s3Client.send(command);
    const url = `https://${getEnvVar('AWS_BUCKET_NAME')}.s3.${getEnvVar('AWS_REGION')}.amazonaws.com/${key}`;
    console.log('S3 upload successful:', url);
    return url;
  } catch (error) {
    console.error('Error uploading to S3:', error);
    
    // Enhance error reporting
    if ((error as any).Code === 'InvalidAccessKeyId') {
      console.error('S3 ERROR: The AWS Access Key ID is invalid. Please check your credentials.');
    } else if ((error as any).Code === 'SignatureDoesNotMatch') {
      console.error('S3 ERROR: The AWS Secret Access Key is invalid. Please check your credentials.');
    }
    
    throw error;
  }
}

/**
 * Get a signed URL for an S3 object
 * @param key The S3 object key
 * @returns A signed URL that provides temporary access to the S3 object
 */
export async function getObjectSignedUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getEnvVar('AWS_BUCKET_NAME'),
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

/**
 * Create a Safari-compatible File object from an existing file
 * This works around Safari's readonly property issues when working with File objects
 * @param file The original File object
 * @returns A new File object that works in Safari
 */
export async function createSafariCompatibleFile(file: File): Promise<File> {
  try {
    // Create a new Blob from the file to avoid Safari's readonly property issues
    const fileBlob = new Blob([await file.arrayBuffer()], { type: file.type });
    
    // Create a new File with a fixed MIME type for Safari compatibility
    const safeMimeType = file.type || 
      (file.name.endsWith('.mp3') ? 'audio/mpeg' : 
      (file.name.endsWith('.webm') ? 'audio/webm' : 
      'application/octet-stream'));
    
    // Return a new File object with the same content but properly sanitized
    return new File([fileBlob], file.name, { 
      type: safeMimeType,
      lastModified: file.lastModified || Date.now()
    });
  } catch (error) {
    console.error('Error creating Safari-compatible file:', error);
    // Return the original file as fallback
    return file;
  }
}
