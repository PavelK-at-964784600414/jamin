import { NextResponse } from 'next/server';
import { uploadToS3 } from '@/app/lib/s3';

/**
 * This endpoint tests file uploads with specific Safari compatibility handling
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ 
        success: false, 
        error: 'No file provided or not a File object'
      }, { status: 400 });
    }
    
    // Log file details before upload
    const fileInfo = {
      name: file.name,
      size: file.size,
      type: file.type || 'unknown',
      lastModified: file.lastModified,
    };
    console.log('File info before upload:', fileInfo);
    
    // Test different methods of file handling for Safari
    
    // Method 1: Direct upload
    try {
      const fileKey = `test-safari/direct-${Date.now()}-${file.name || 'file.webm'}`;
      const directUrl = await uploadToS3(file, fileKey);
      
      // Method 2: FileReader approach
      const fileReaderResult = await new Promise<{ url: string, fileInfo: any }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          try {
            const arrayBuffer = event.target?.result as ArrayBuffer;
            if (!arrayBuffer) {
              reject(new Error('FileReader did not produce a result'));
              return;
            }
            
            // Create a new Blob and File from the ArrayBuffer
            const fileBlob = new Blob([arrayBuffer], { type: file.type || 'audio/webm' });
            const safeFile = new File([fileBlob], 
              file.name || `filereader-${Date.now()}.webm`,
              { 
                type: file.type || 'audio/webm',
                lastModified: Date.now()
              }
            );
            
            // Upload the safe file
            const fileKey = `test-safari/filereader-${Date.now()}-${safeFile.name}`;
            const url = await uploadToS3(safeFile, fileKey);
            
            // Return success info
            resolve({
              url,
              fileInfo: {
                name: safeFile.name,
                size: safeFile.size,
                type: safeFile.type,
              }
            });
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = () => reject(new Error('FileReader failed'));
        reader.readAsArrayBuffer(file);
      });
      
      // Return success with both methods
      return NextResponse.json({
        success: true,
        directUpload: {
          success: true,
          url: directUrl,
          fileInfo
        },
        fileReaderUpload: {
          success: true,
          url: fileReaderResult.url,
          fileInfo: fileReaderResult.fileInfo
        }
      });
    } catch (uploadError) {
      console.error('Error during test uploads:', uploadError);
      return NextResponse.json({
        success: false,
        error: uploadError instanceof Error ? uploadError.message : String(uploadError),
        fileInfo
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Test file upload error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
