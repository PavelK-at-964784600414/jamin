import { NextRequest, NextResponse } from 'next/server';
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
        'jamin-audio-storage.s3.amazonaws.com',
        'localhost',
        '127.0.0.1'
      ];
      
      if (!allowedDomains.some(domain => url.hostname.includes(domain))) {
        logger.warn('Attempted to proxy non-allowed domain', { metadata: { hostname: url.hostname } });
        return NextResponse.json({ error: 'URL not allowed' }, { status: 403 });
      }
    } catch (urlError) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    logger.debug('[AudioProxy] Fetching audio file', { metadata: { url: audioUrl } });
    
    // Fetch the audio file
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

    // Get the audio data
    const audioBuffer = await response.arrayBuffer();
    
    // Return the audio data with proper headers
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mpeg',
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
