import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
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
      console.warn('Error getting arrayBuffer, trying alternative approach:', arrayBufferError);
      
      // Alternative approach for Safari
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
            
            const command = new PutObjectCommand({
              Bucket: process.env.AWS_BUCKET_NAME,
              Key: key,
              Body: uint8Array,
              ContentType: file.type || 'audio/webm',
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
    }
    
    // Standard upload path
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: file.type || 'audio/webm',
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
      lastModified: file.lastModified 
    });
  } catch (error) {
    console.error('Error creating Safari-compatible file:', error);
    // Return the original file as fallback
    return file;
  }
}