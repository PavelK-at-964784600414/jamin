'use client';

import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { logger } from '@/app/lib/logger';

interface MediaPlayerModalProps {
  mediaURL: string | null;
  isOpen: boolean;
  onClose: () => void;
  isVideo?: boolean; // Optional prop to force video mode
}

export default function MediaPlayerModal({ mediaURL, isOpen, onClose, isVideo }: MediaPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoFile, setIsVideoFile] = useState(false);

  // Determine if the media is a video file
  useEffect(() => {
    if (mediaURL) {
      // Check if it's explicitly set as video or if the URL suggests it's a video
      const urlIsVideo = isVideo || 
        mediaURL.includes('.mp4') || 
        mediaURL.includes('.webm') || 
        mediaURL.includes('.mov') || 
        mediaURL.includes('.avi') ||
        mediaURL.includes('video/');
      setIsVideoFile(urlIsVideo);
    }
  }, [mediaURL, isVideo]);

  useEffect(() => {
    if (isOpen && mediaURL) {
      if (isVideoFile && videoRef.current) {
        videoRef.current.load();
        videoRef.current.play().catch(error => logger.error("Error playing video", { metadata: { error: error instanceof Error ? error.message : String(error) } }));
      } else if (!isVideoFile && audioRef.current) {
        audioRef.current.load();
        audioRef.current.play().catch(error => logger.error("Error playing audio", { metadata: { error: error instanceof Error ? error.message : String(error) } }));
      }
    } else {
      // Pause both audio and video when closing
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (videoRef.current) {
        videoRef.current.pause();
      }
    }
  }, [isOpen, mediaURL, isVideoFile]);

  if (!isOpen || !mediaURL) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl p-6 w-full relative ${
        isVideoFile ? 'max-w-4xl' : 'max-w-md'
      }`}>
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 z-10"
          aria-label="Close media player"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
          {isVideoFile ? 'Video Playback' : 'Theme Playback'}
        </h3>
        
        {isVideoFile ? (
          <video
            ref={videoRef}
            controls
            preload="auto"
            src={mediaURL}
            className="w-full rounded-lg"
            style={{ maxHeight: '70vh' }}
            key={mediaURL}
          >
            Your browser does not support the video element.
          </video>
        ) : (
          <audio
            ref={audioRef}
            controls
            preload="auto"
            src={mediaURL}
            className="w-full h-14 bg-transparent border-none"
            key={mediaURL}
          >
            Your browser does not support the audio element.
          </audio>
        )}
      </div>
    </div>
  );
}