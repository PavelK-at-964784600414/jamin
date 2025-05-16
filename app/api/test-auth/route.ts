import { NextResponse } from 'next/server';
import { uploadToS3 } from '@/app/lib/s3';

// Test file upload functionality for Safari
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }
    
    // Test file properties
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    };
    
    // Try to upload using our S3 function
    try {
      const fileKey = `test/${Date.now()}-${file.name || 'test.webm'}`;
      const url = await uploadToS3(file, fileKey);
      
      return NextResponse.json({
        success: true,
        fileInfo,
        uploadSuccess: true,
        url,
      });
    } catch (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({
        success: true,
        fileInfo,
        uploadSuccess: false,
        error: uploadError instanceof Error ? uploadError.message : String(uploadError),
      });
    }
  } catch (error) {
    console.error('Test upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export const GET = async () => {
  try {
    // Test both import styles
    let directImport = false;
    let destructuredImport = false;
    let authResult = null;
    
    // Test the direct import style
    try {
      const authModule = await import('@/auth-config.js');
      directImport = typeof authModule.auth === 'function';
      if (directImport) {
        authResult = await authModule.auth();
      }
    } catch (error) {
      console.error('Direct import test failed:', error);
    }
    
    // Test the destructured import style
    try {
      const { auth } = await import('@/auth-config.js');
      destructuredImport = typeof auth === 'function';
      if (!authResult && destructuredImport) {
        authResult = await auth();
      }
    } catch (error) {
      console.error('Destructured import test failed:', error);
    }
    
    // If we have a session, authentication is working
    const isAuthenticated = !!authResult;
    
    return NextResponse.json({
      success: directImport || destructuredImport,
      directImportWorks: directImport,
      destructuredImportWorks: destructuredImport,
      isAuthenticated,
      session: isAuthenticated ? {
        user: {
          id: authResult?.user?.id || null,
          name: authResult?.user?.name || null,
          email: authResult?.user?.email || null
        }
      } : null
    });
  } catch (error) {
    console.error('Auth test API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
