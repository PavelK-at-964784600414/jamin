/**
 * Video Utilities for Jamin
 * This file contains helper functions for video recording, processing, and validation
 */

import { uploadFileToS3WithRetry } from '@/app/lib/upload-utils';
import { logger } from '@/app/lib/logger';

/**
 * Check if a video file is valid and playable
 * @param file The file to check
 * @returns Promise resolving to true if file is valid
 */
export async function validateVideoFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    // Create video element to test
    const video = document.createElement('video');
    let timeout: NodeJS.Timeout;
    
    // Success handler
    video.oncanplaythrough = () => {
      clearTimeout(timeout);
      logger.debug('Video file validated successfully');
      resolve(true);
    };
    
    // Error handler
    video.onerror = (err) => {
      clearTimeout(timeout);
      logger.error('Video validation failed', { metadata: { data: err } });
      resolve(false);
    };
    
    // Set timeout to prevent long waits
    timeout = setTimeout(() => {
      logger.warn('Video validation timed out');
      resolve(false);
    }, 5000);
    
    // Create object URL and test playback
    const url = URL.createObjectURL(file);
    video.src = url;
    video.load();
  });
}

/**
 * Get supported video recording formats for the current browser
 * @returns Object with information about supported formats
 */
export function getSupportedVideoFormats() {
  if (typeof window === 'undefined' || !window.MediaRecorder) {
    return { supported: false, formats: [] };
  }

  const formats = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus', 
    'video/webm;codecs=h264,opus',
    'video/mp4;codecs=h264,aac',
    'video/webm',
    'video/mp4'
  ];

  const supportedFormats = formats.filter(format => 
    MediaRecorder.isTypeSupported(format)
  );

  return {
    supported: supportedFormats.length > 0,
    formats: supportedFormats,
    preferred: supportedFormats[0] || 'video/webm'
  };
}

/**
 * Get the duration of a video file in seconds
 * @param file The video file to analyze
 * @returns Promise resolving to duration in seconds
 */
export async function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    
    video.onloadedmetadata = () => {
      resolve(video.duration);
      URL.revokeObjectURL(video.src);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video file'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(file);
    video.load();
  });
}

/**
 * Extract audio from a video file using Web APIs
 * @param videoFile The video file to extract audio from
 * @returns Promise resolving to an audio File object
 */
export async function extractAudioFromVideo(videoFile: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    video.onloadedmetadata = async () => {
      try {
        // Create audio context and media element source
        const source = audioContext.createMediaElementSource(video);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        
        // Create media recorder for audio-only stream
        const mediaRecorder = new MediaRecorder(destination.stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data);
          }
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], 
            videoFile.name.replace(/\.[^/.]+$/, '.webm'), 
            { type: 'audio/webm' }
          );
          resolve(audioFile);
        };
        
        // Start recording and play video to extract audio
        mediaRecorder.start();
        video.play();
        
        // Stop when video ends
        video.onended = () => {
          mediaRecorder.stop();
        };
        
      } catch (error) {
        reject(error);
      }
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video file'));
    };
    
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

/**
 * Create a video thumbnail from a video file
 * @param videoFile The video file to create thumbnail from
 * @param timeOffset Time offset in seconds for thumbnail (default: 1)
 * @returns Promise resolving to a thumbnail blob
 */
export async function createVideoThumbnail(
  videoFile: File, 
  timeOffset: number = 1
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      video.currentTime = Math.min(timeOffset, video.duration);
    };
    
    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create thumbnail blob'));
        }
        URL.revokeObjectURL(video.src);
      }, 'image/jpeg', 0.8);
    };
    
    video.onerror = () => {
      reject(new Error('Failed to load video file'));
      URL.revokeObjectURL(video.src);
    };
    
    video.src = URL.createObjectURL(videoFile);
    video.load();
  });
}

/**
 * Check if a file is a video file
 * @param file The file to check
 * @returns True if the file is a video file
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Check if a file is an audio file  
 * @param file The file to check
 * @returns True if the file is an audio file
 */
export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/');
}

/**
 * Get media file type (audio or video)
 * @param file The file to check
 * @returns 'video', 'audio', or 'unknown'
 */
export function getMediaFileType(file: File): 'video' | 'audio' | 'unknown' {
  if (isVideoFile(file)) return 'video';
  if (isAudioFile(file)) return 'audio';
  return 'unknown';
}