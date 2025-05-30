/**
 * Audio Utilities for Jamin
 * This file contains helper functions for audio recording and processing
 * with compatibility fixes for different browsers.
 */

import { uploadFileToS3WithRetry } from '@/app/lib/upload-utils';

/**
 * Check if an audio file is valid and playable
 * @param file The file to check
 * @returns Promise resolving to true if file is valid
 */
export async function validateAudioFile(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    // Create audio element to test
    const audio = new Audio();
    let timeout: NodeJS.Timeout;
    
    // Success handler
    audio.oncanplaythrough = () => {
      clearTimeout(timeout);
      console.log('Audio file validated successfully');
      resolve(true);
    };
    
    // Error handler
    audio.onerror = (err) => {
      clearTimeout(timeout);
      console.error('Audio validation failed:', err);
      resolve(false);
    };
    
    // Set timeout to prevent long waits
    timeout = setTimeout(() => {
      console.warn('Audio validation timed out');
      resolve(false);
    }, 3000);
    
    // Create object URL and test playback
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.load();
  });
}

/**
 * Get supported audio recording formats for the current browser
 * @returns Object with information about supported formats
 */
export function getSupportedAudioFormats() {
  // Default to WEBM which is widely supported
  const result = {
    audio: {
      preferredFormat: 'audio/webm',
      supported: ['audio/webm']
    },
    video: {
      preferredFormat: 'video/webm',
      supported: ['video/webm']
    }
  };
  
  // Only run checks in browser environment
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return result;
  }
  
  // Check common audio formats
  const audioFormats = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg;codecs=opus'
  ];
  
  const videoFormats = [
    'video/webm;codecs=vp8,opus',
    'video/webm;codecs=vp9,opus',
    'video/webm',
    'video/mp4;codecs=h264,aac',
    'video/mp4'
  ];
  
  // Build list of supported formats
  const supportedAudio = audioFormats.filter(format => MediaRecorder.isTypeSupported(format));
  const supportedVideo = videoFormats.filter(format => MediaRecorder.isTypeSupported(format));
  
  if (supportedAudio.length > 0) {
    result.audio.preferredFormat = supportedAudio[0];
    result.audio.supported = supportedAudio;
  }
  
  if (supportedVideo.length > 0) {
    result.video.preferredFormat = supportedVideo[0];
    result.video.supported = supportedVideo;
  }
  
  // Safari specific detection
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  if (isSafari) {
    console.log('Safari browser detected, using Safari-compatible audio formats');
    // For Safari, prefer MP4 formats when available
    const safariAudio = supportedAudio.find(format => format.includes('mp4'));
    if (safariAudio) {
      result.audio.preferredFormat = safariAudio;
    }
    
    const safariVideo = supportedVideo.find(format => format.includes('mp4'));
    if (safariVideo) {
      result.video.preferredFormat = safariVideo;
    }
  }
  
  console.log('Browser supported audio formats:', result);
  return result;
}

/**
 * Get the duration of an audio file in seconds
 * @param file The audio file to analyze
 * @returns Promise resolving to duration in seconds
 */
export async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    let timeout: NodeJS.Timeout;
    
    // Success handler
    audio.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = audio.duration;
      console.log('Audio duration:', duration, 'seconds');
      // Clean up
      URL.revokeObjectURL(audio.src);
      resolve(isFinite(duration) ? Math.round(duration) : 0);
    };
    
    // Error handler
    audio.onerror = (err) => {
      clearTimeout(timeout);
      console.error('Failed to get audio duration:', err);
      URL.revokeObjectURL(audio.src);
      reject(new Error('Failed to load audio file'));
    };
    
    // Set timeout to prevent long waits
    timeout = setTimeout(() => {
      console.warn('Audio duration detection timed out');
      URL.revokeObjectURL(audio.src);
      resolve(0); // Default to 0 if we can't determine duration
    }, 5000);
    
    // Create object URL and load audio
    const url = URL.createObjectURL(file);
    audio.src = url;
    audio.load();
  });
}

/**
 * Get the duration of a media file (audio or video) in seconds
 * @param file The media file to analyze
 * @returns Promise resolving to duration in seconds
 */
export async function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    // Determine if it's a video or audio file
    const isVideo = file.type.startsWith('video/');
    const element = isVideo ? document.createElement('video') : new Audio();
    let timeout: NodeJS.Timeout;
    
    // Success handler
    element.onloadedmetadata = () => {
      clearTimeout(timeout);
      const duration = (element as HTMLMediaElement).duration;
      console.log(`Media duration detected: ${duration} seconds for ${file.name}`);
      resolve(duration);
      URL.revokeObjectURL(element.src);
    };
    
    // Error handler
    element.onerror = (err) => {
      clearTimeout(timeout);
      console.error('Media duration detection failed:', err);
      resolve(0);
      URL.revokeObjectURL(element.src);
    };
    
    // Set timeout to prevent long waits
    timeout = setTimeout(() => {
      console.warn('Media duration detection timed out');
      resolve(0);
      URL.revokeObjectURL(element.src);
    }, 5000);
    
    // Create object URL and load media
    const url = URL.createObjectURL(file);
    element.src = url;
    element.load();
  });
}
