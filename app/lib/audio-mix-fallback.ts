// Simple fallback approach - gracefully disable feature
export async function mixAudioFilesWithFallback(originalUrl: string, layerUrl: string): Promise<string | null> {
  // Check if we're on Vercel or if ffmpeg is unavailable
  const isVercel = process.env.VERCEL || process.env.VERCEL_ENV;
  
  if (isVercel) {
    console.log('Audio mixing not available on Vercel deployment - returning original audio');
    return originalUrl; // Just return the original audio
  }

  try {
    // Try server-side mixing
    const { mixAudioFiles } = await import('./audio-mix-server');
    return await mixAudioFiles(originalUrl, layerUrl);
  } catch (error) {
    console.log('Server-side audio mixing failed, returning original audio:', error);
    return originalUrl; // Fallback to original
  }
}
