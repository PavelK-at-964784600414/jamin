import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { logger } from '@/app/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url');
    
    if (!audioUrl) {
      return NextResponse.json({ error: 'Missing audio URL parameter' }, { status: 400 });
    }

    // Validate that it's a legitimate audio URL (basic security check)
    try {
      const url = new URL(audioUrl);
      // Only allow our S3 bucket URLs or localhost for development
      const allowedDomains = [
        'jamin-recordings-storage.s3.us-east-2.amazonaws.com',
        'jamin-audio-storage.s3.amazonaws.com',
        'localhost',
        '127.0.0.1'
      ];
      
      const isAllowed = allowedDomains.some(domain => 
        url.hostname === domain || url.hostname.includes(domain)
      );
      
      if (!isAllowed) {
        logger.warn('Attempted to proxy non-allowed domain', { metadata: { hostname: url.hostname, allowedDomains } });
        return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
      }
    } catch (urlError) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    logger.debug('[AudioProxy] Fetching audio file', { metadata: { url: audioUrl } });
    
    let audioBuffer: ArrayBuffer;
    let contentType = 'audio/mpeg';
    
    // Check if this is an S3 URL and use AWS SDK for better authentication
    const url = new URL(audioUrl);
    if (url.hostname.includes('s3.us-east-2.amazonaws.com') || url.hostname.includes('s3.amazonaws.com')) {
      try {
        // Extract bucket and key from S3 URL
        const pathParts = url.pathname.substring(1).split('/');
        const bucketName = process.env.AWS_BUCKET_NAME || 'jamin-recordings-storage';
        const key = pathParts.join('/');
        
        logger.debug('[AudioProxy] Using S3 SDK for authenticated access', { 
          metadata: { bucket: bucketName, key: key } 
        });
        
        // Create S3 client
        const s3Client = new S3Client({
          region: process.env.AWS_REGION || 'us-east-2',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });
        
        // Get the object from S3
        const command = new GetObjectCommand({
          Bucket: bucketName,
          Key: key,
        });
        
        const response = await s3Client.send(command);
        
        if (!response.Body) {
          throw new Error('No data received from S3');
        }
        
        // Convert stream to ArrayBuffer
        const chunks = [];
        const reader = response.Body.transformToWebStream().getReader();
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }
        
        // Combine chunks into a single ArrayBuffer
        const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combined = new Uint8Array(totalLength);
        let offset = 0;
        
        for (const chunk of chunks) {
          combined.set(chunk, offset);
          offset += chunk.length;
        }
        
        audioBuffer = combined.buffer;
        contentType = response.ContentType || 'audio/mpeg';
        
      } catch (s3Error) {
        logger.error('[AudioProxy] S3 access failed, falling back to direct fetch', { 
          metadata: { error: s3Error instanceof Error ? s3Error.message : String(s3Error) } 
        });
        
        // Fall back to direct fetch
        const response = await fetch(audioUrl);
        if (!response.ok) {
          logger.error('[AudioProxy] Direct fetch also failed', { 
            metadata: { 
              status: response.status, 
              statusText: response.statusText,
              url: audioUrl 
            } 
          });
          return NextResponse.json({ error: 'Failed to fetch audio file' }, { status: response.status });
        }
        audioBuffer = await response.arrayBuffer();
        contentType = response.headers.get('Content-Type') || 'audio/mpeg';
      }
    } else {
      // For non-S3 URLs, use direct fetch
      const response = await fetch(audioUrl);
      
      if (!response.ok) {
        logger.error('[AudioProxy] Failed to fetch audio file', { 
          metadata: { 
            status: response.status, 
            statusText: response.statusText,
            url: audioUrl 
          } 
        });
        return NextResponse.json({ error: 'Failed to fetch audio file' }, { status: response.status });
      }
      
      audioBuffer = await response.arrayBuffer();
      contentType = response.headers.get('Content-Type') || 'audio/mpeg';
    }
    
    // Return the audio data with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*', // Allow CORS
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    logger.error('[AudioProxy] Error processing request', { 
      metadata: { error: error instanceof Error ? error.message : String(error) } 
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
