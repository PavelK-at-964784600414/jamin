import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // First check for comments in AWS credentials
    const rawAccessKeyId = process.env.AWS_ACCESS_KEY_ID || '';
    const rawSecretKey = process.env.AWS_SECRET_ACCESS_KEY || '';
    
    const hasCommentsInAccessKey = rawAccessKeyId.includes('#');
    const hasCommentsInSecretKey = rawSecretKey.includes('#');
    
    // Clean the keys
    const cleanAccessKeyId = rawAccessKeyId.split('#')[0].trim();
    const cleanSecretKey = rawSecretKey.split('#')[0].trim();
    
    // Log credential info for debugging
    console.log('Credential Diagnostics:');
    console.log(`- Raw Access Key Length: ${rawAccessKeyId.length}`);
    console.log(`- Access Key has comments: ${hasCommentsInAccessKey}`);
    console.log(`- Clean Access Key Length: ${cleanAccessKeyId.length}`);
    console.log(`- Raw Secret Key Length: ${rawSecretKey.length}`);
    console.log(`- Secret Key has comments: ${hasCommentsInSecretKey}`);
    
    // Create S3 client with cleaned credentials
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretKey,
      },
    });
    
    // Try a simple upload to test credentials
    const testKey = `test-file-fix-${Date.now()}.txt`;
    const testContent = 'This is a test file to verify AWS S3 credentials fix';
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain'
    });
    
    console.log(`Attempting to upload test file: ${testKey}`);
    await s3Client.send(uploadCommand);
    
    // If we get here, the upload succeeded
    return NextResponse.json({
      success: true,
      message: 'AWS credentials fixed! Test file uploaded successfully',
      diagnostics: {
        rawAccessKeyIdLength: rawAccessKeyId.length,
        cleanAccessKeyIdLength: cleanAccessKeyId.length,
        hasCommentsInAccessKey,
        hasCommentsInSecretKey,
        rawSecretKeyLength: rawSecretKey.length
      },
      testFile: {
        key: testKey,
        url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${testKey}`
      }
    });
  } catch (error) {
    console.error('AWS credential test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'AWS credential test failed after comments fix',
      error: error instanceof Error ? error.message : String(error),
      errorCode: (error as any).Code || (error as any).code || 'unknown'
    }, { status: 500 });
  }
}
