import { NextResponse } from 'next/server';
import { S3Client, ListBucketsCommand, PutObjectCommand } from '@aws-sdk/client-s3';

// Helper function to verify if a key looks valid
function isKeyFormatValid(key: string | undefined): boolean {
  if (!key) return false;
  // AWS Access Keys are typically 20 characters
  if (key.length !== 20) return false;
  // Should start with 'AKIA' for AWS IAM user access keys
  if (!key.startsWith('AKIA')) return false;
  return true;
}

// Helper function to verify if a secret looks valid
function isSecretFormatValid(secret: string | undefined): boolean {
  if (!secret) return false;
  // AWS Secret Access Keys are typically 40 characters
  return secret.length === 40;
}

export async function GET() {
  try {
    // Log and validate raw environment variables
    const region = process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const bucketName = process.env.AWS_BUCKET_NAME;
    
    console.log('Validating AWS credentials format:');
    
    const validations = {
      region: !!region,
      accessKeyFormat: isKeyFormatValid(accessKeyId),
      secretKeyFormat: isSecretFormatValid(secretAccessKey),
      bucketName: !!bucketName
    };
    
    console.log('Validation results:', validations);
    
    // If any validation fails, return helpful error messages
    if (!validations.region) {
      return NextResponse.json(
        { success: false, message: 'AWS_REGION is missing or invalid' },
        { status: 500 }
      );
    }
    
    if (!validations.accessKeyFormat) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'AWS_ACCESS_KEY_ID format appears invalid', 
          details: `Length: ${accessKeyId?.length || 0}, Expected: 20. Should start with AKIA.`
        },
        { status: 500 }
      );
    }
    
    if (!validations.secretKeyFormat) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'AWS_SECRET_ACCESS_KEY format appears invalid', 
          details: `Length: ${secretAccessKey?.length || 0}, Expected: 40.`
        },
        { status: 500 }
      );
    }
    
    if (!validations.bucketName) {
      return NextResponse.json(
        { success: false, message: 'AWS_BUCKET_NAME is missing' },
        { status: 500 }
      );
    }
    
    // Clean up AWS credentials from any comments or extra whitespace
    const cleanAccessKeyId = accessKeyId!.split('#')[0].trim();
    const cleanSecretAccessKey = secretAccessKey!.split('#')[0].trim();
    
    console.log(`Clean Access Key ID length: ${cleanAccessKeyId.length}`);
    console.log(`Clean Secret Key length: ${cleanSecretAccessKey.length}`);
    
    // Create an S3 client with cleaned credentials
    const s3Client = new S3Client({
      region: region!,
      credentials: {
        accessKeyId: cleanAccessKeyId,
        secretAccessKey: cleanSecretAccessKey,
      },
    });
    
    // Try uploading a simple test file
    const testKey = `test/format-validation-${Date.now()}.txt`;
    const testData = 'This is a test file to verify AWS S3 credentials';
    
    console.log(`Attempting to upload test file to ${bucketName}/${testKey}`);
    
    await s3Client.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testData,
      ContentType: 'text/plain',
    }));
    
    // If we get here, upload was successful
    return NextResponse.json({
      success: true,
      message: 'AWS credentials validated and test file uploaded successfully',
      validations,
      testFile: {
        bucket: bucketName,
        key: testKey,
        url: `https://${bucketName}.s3.${region}.amazonaws.com/${testKey}`
      }
    });
  } catch (error: any) {
    console.error('AWS credentials validation failed:', error);
    
    // Provide more details about the error
    const errorResponse = {
      success: false,
      message: 'AWS credentials test failed',
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorCode: error.Code || error.code || 'unknown',
      requestId: error.RequestId || error.requestId || 'unknown',
    };
    
    // Special handling for common AWS errors
    if (errorResponse.errorCode === 'InvalidAccessKeyId') {
      errorResponse.message = 'Invalid Access Key ID. The AWS access key ID you provided does not exist in AWS records.';
    } else if (errorResponse.errorCode === 'SignatureDoesNotMatch') {
      errorResponse.message = 'Invalid Secret Access Key. The request signature calculated does not match the signature you provided.';
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
