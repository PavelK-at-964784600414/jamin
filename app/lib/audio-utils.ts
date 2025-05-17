/**
 * Audio Utilities for Jamin
 * This file contains helper functions for audio recording and processing
 * with compatibility fixes for different browsers.
 */

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
