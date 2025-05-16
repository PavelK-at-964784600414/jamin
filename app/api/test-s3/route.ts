import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

export async function GET() {
  try {
    // Log raw environment variables to debug
    console.log('Raw AWS environment variables:');
    console.log(`AWS_REGION=${process.env.AWS_REGION}`);
    console.log(`AWS_ACCESS_KEY_ID length=${process.env.AWS_ACCESS_KEY_ID?.length || 'undefined'}`);
    console.log(`AWS_SECRET_ACCESS_KEY length=${process.env.AWS_SECRET_ACCESS_KEY?.length || 'undefined'}`);
    console.log(`AWS_BUCKET_NAME=${process.env.AWS_BUCKET_NAME}`);
    
    // Clean up AWS credentials from any comments or extra whitespace
    const cleanAccessKeyId = process.env.AWS_ACCESS_KEY_ID!.split('#')[0].trim();
    const cleanSecretAccessKey = process.env.AWS_SECRET_ACCESS_KEY!.split('#')[0].trim();
    
    console.log(`Clean Access Key ID length: ${cleanAccessKeyId.length}`);
    console.log(`Clean Access Key ID: ${cleanAccessKeyId.substring(0, 5)}...`);
    
    // Create an S3 client with cleaned credentials
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
    });

    // Log the credentials being used (without exposing the full secret)
    const accessKeyIdPreview = process.env.AWS_ACCESS_KEY_ID ? 
      `${process.env.AWS_ACCESS_KEY_ID.substring(0, 5)}...${process.env.AWS_ACCESS_KEY_ID.substring(process.env.AWS_ACCESS_KEY_ID.length - 5)}` : 'undefined';
    
    const secretKeyPreview = process.env.AWS_SECRET_ACCESS_KEY ? 
      `${process.env.AWS_SECRET_ACCESS_KEY.substring(0, 3)}...${process.env.AWS_SECRET_ACCESS_KEY.substring(process.env.AWS_SECRET_ACCESS_KEY.length - 3)}` : 'undefined';
    
    console.log('AWS Credentials being used:');
    console.log(`Region: ${process.env.AWS_REGION}`);
    console.log(`Access Key ID: ${accessKeyIdPreview}`);
    console.log(`Secret Access Key: ${secretKeyPreview}`);
    console.log(`Bucket: ${process.env.AWS_BUCKET_NAME}`);

    // Try to list buckets as a simple test
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);
    
    // Try uploading a simple test file to validate write permissions
    const testFileContent = 'This is a test file to validate AWS S3 credentials';
    const testKey = `test/s3-test-${Date.now()}.txt`;
    
    console.log(`Attempting to upload test file to ${process.env.AWS_BUCKET_NAME}/${testKey}`);
    
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: testKey,
      Body: testFileContent,
      ContentType: 'text/plain',
    });
    
    await s3Client.send(uploadCommand);
    
    const testFileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${testKey}`;
    
    // Return the list of buckets to verify credentials work
    return NextResponse.json({ 
      success: true, 
      message: 'AWS credentials are valid.',
      buckets: listResponse.Buckets?.map(bucket => bucket.Name) || [],
      region: process.env.AWS_REGION,
      requestedBucket: process.env.AWS_BUCKET_NAME,
      testFileUploaded: true,
      testFileUrl
    });
  } catch (error) {
    console.error('AWS credentials test failed:', error);
    
    // Get detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : 'No stack trace available';
    const errorName = error instanceof Error ? error.name : 'Unknown Error';
    
    // Log additional details for debugging
    console.error(`Error name: ${errorName}`);
    console.error(`Error stack: ${errorStack}`);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'AWS credentials test failed', 
        error: errorMessage,
        errorDetails: {
          name: errorName,
          code: (error as any).Code || (error as any).code || 'unknown',
          requestId: (error as any).RequestId || (error as any).requestId || 'unknown'
        }
      },
      { status: 500 }
    );
  }
}
