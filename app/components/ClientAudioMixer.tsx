'use client';

import { useState, useEffect, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { logger } from '@/app/lib/logger';

interface ClientAudioMixerProps {
  originalAudioUrl: string;
  layerAudioUrl: string | File;
  onMixComplete: (mixedAudioBlob: Blob) => void;
  onMixError: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export default function ClientAudioMixer({
  originalAudioUrl,
  layerAudioUrl,
  onMixComplete,
  onMixError,
  onProgress
}: ClientAudioMixerProps) {
  const [ffmpeg, setFfmpeg] = useState<FFmpeg | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize FFmpeg
  useEffect(() => {
    const loadFFmpeg = async () => {
      try {
        logger.debug('[ClientAudioMixer] Initializing FFmpeg WASM');
        const ffmpegInstance = new FFmpeg();
        
        // Set up progress tracking
        ffmpegInstance.on('progress', ({ progress }) => {
          const progressPercent = Math.round(progress * 100);
          setProgress(progressPercent);
          onProgress?.(progressPercent);
          logger.debug(`[ClientAudioMixer] Progress: ${progressPercent}%`);
        });

        ffmpegInstance.on('log', ({ message }) => {
          logger.debug(`[FFmpeg WASM] ${message}`);
        });

        logger.debug('[ClientAudioMixer] Loading FFmpeg WASM...');
        await ffmpegInstance.load();
        setFfmpeg(ffmpegInstance);
        setIsLoading(false);
        logger.debug('[ClientAudioMixer] FFmpeg WASM loaded successfully');
      } catch (error) {
        logger.error('[ClientAudioMixer] Failed to load FFmpeg WASM:', { metadata: { error: error instanceof Error ? error.message : String(error) } });
        setIsLoading(false);
        onMixError('Failed to initialize audio processor. Please try again.');
      }
    };

    loadFFmpeg();
  }, [onMixError, onProgress]);

  // Mix audio files
  const mixAudio = useCallback(async () => {
    if (!ffmpeg) {
      onMixError('Audio processor not ready. Please wait and try again.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);

    try {
      logger.debug('[ClientAudioMixer] Starting audio mixing process');
      
      // Handle original audio file (URL)
      logger.debug('[ClientAudioMixer] Fetching original audio file from URL', { metadata: { url: originalAudioUrl } });
      let originalFile;
      
      // Check if this is an S3 URL that needs proxying
      const isS3Url = originalAudioUrl.includes('s3.') || originalAudioUrl.includes('amazonaws.com');
      
      if (isS3Url) {
        // Always use proxy for S3 URLs to avoid CORS issues
        logger.debug('[ClientAudioMixer] Using proxy for S3 URL');
        try {
          const proxyUrl = `/api/proxy-audio?url=${encodeURIComponent(originalAudioUrl)}`;
          originalFile = await fetchFile(proxyUrl);
        } catch (proxyError) {
          logger.error('[ClientAudioMixer] Proxy fetch failed for S3 URL:', { metadata: { error: proxyError instanceof Error ? proxyError.message : String(proxyError) } });
          throw new Error('Cannot access original audio file from S3. Please check your internet connection.');
        }
      } else {
        // For non-S3 URLs, try direct fetch first, then fallback to proxy
        try {
          // First try to fetch directly
          originalFile = await fetchFile(originalAudioUrl);
        } catch (fetchError) {
          logger.debug('[ClientAudioMixer] Direct fetch failed, trying through proxy:', { metadata: { error: fetchError instanceof Error ? fetchError.message : String(fetchError) } });
          // Try using our proxy to avoid CORS issues
          try {
            const proxyUrl = `/api/proxy-audio?url=${encodeURIComponent(originalAudioUrl)}`;
            originalFile = await fetchFile(proxyUrl);
          } catch (proxyError) {
            logger.error('[ClientAudioMixer] Both direct and proxy fetch failed:', { metadata: { error: proxyError instanceof Error ? proxyError.message : String(proxyError) } });
            throw new Error('Cannot access original audio file. Please check your internet connection.');
          }
        }
      }
      
      // Handle layer audio file (File object or URL)
      logger.debug('[ClientAudioMixer] Processing layer audio file');
      let layerFile;
      try {
        if (layerAudioUrl instanceof File) {
          // If it's a File object, convert it to Uint8Array
          const arrayBuffer = await layerAudioUrl.arrayBuffer();
          layerFile = new Uint8Array(arrayBuffer);
        } else {
          // If it's a URL (blob URL), fetch it
          layerFile = await fetchFile(layerAudioUrl);
        }
      } catch (layerError) {
        logger.error('[ClientAudioMixer] Failed to process layer audio:', { metadata: { error: layerError instanceof Error ? layerError.message : String(layerError) } });
        throw new Error('Cannot process layer audio file.');
      }

      // Write files to FFmpeg virtual file system
      logger.debug('[ClientAudioMixer] Writing files to FFmpeg virtual file system');
      await ffmpeg.writeFile('original.audio', originalFile);
      await ffmpeg.writeFile('layer.audio', layerFile);

      logger.debug('[ClientAudioMixer] Running FFmpeg audio mixing command');
      
      // Run FFmpeg command to mix audio - use more compatible approach
      await ffmpeg.exec([
        '-i', 'original.audio',
        '-i', 'layer.audio',
        '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=longest:normalize=0',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-f', 'mp4',
        'mixed.mp4'
      ]);

      // Read the mixed audio file
      logger.debug('[ClientAudioMixer] Reading mixed audio output');
      const mixedData = await ffmpeg.readFile('mixed.mp4');
      
      // Create blob for the mixed audio
      const mixedBlob = new Blob([mixedData], { type: 'audio/mp4' });

      logger.debug('[ClientAudioMixer] Audio mixing completed successfully');
      onMixComplete(mixedBlob);

      // Clean up virtual file system
      await ffmpeg.deleteFile('original.audio');
      await ffmpeg.deleteFile('layer.audio');
      await ffmpeg.deleteFile('mixed.mp4');

    } catch (error) {
      logger.error('[ClientAudioMixer] Audio mixing failed:', { metadata: { error: error instanceof Error ? error.message : String(error) } });
      onMixError('Audio mixing failed. Please try again.');
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [ffmpeg, originalAudioUrl, layerAudioUrl, onMixComplete, onMixError]);

  // Auto-start mixing when component is ready and has URLs
  useEffect(() => {
    logger.debug('[ClientAudioMixer] useEffect triggered', {
      metadata: {
        ffmpeg: !!ffmpeg,
        isLoading,
        isProcessing,
        originalAudioUrl: !!originalAudioUrl,
        layerAudioUrl: !!layerAudioUrl,
        originalAudioType: typeof originalAudioUrl,
        layerAudioType: typeof layerAudioUrl
      }
    });
    
    if (ffmpeg && !isLoading && !isProcessing && originalAudioUrl && layerAudioUrl) {
      logger.debug('[ClientAudioMixer] All conditions met, starting mix');
      mixAudio();
    } else {
      logger.debug('[ClientAudioMixer] Conditions not met for auto-start');
    }
  }, [ffmpeg, isLoading, isProcessing, originalAudioUrl, layerAudioUrl, mixAudio]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Initializing audio processor...</span>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Mixing audio...</span>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return null; // Component is transparent when not processing
}
