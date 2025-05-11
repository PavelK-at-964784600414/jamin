'use client';

import React, { useEffect, useRef } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface MediaPlayerModalProps {
  mediaURL: string | null;
  isOpen: boolean;
  onClose: () => void;
  // isVideoMode is removed as we are focusing on audio for themes
}

export default function MediaPlayerModal({ mediaURL, isOpen, onClose }: MediaPlayerModalProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (isOpen && audioRef.current) {
      audioRef.current.load(); // Reload the audio source when the modal opens or mediaURL changes
      audioRef.current.play().catch(error => console.error("Error playing audio:", error));
    } else if (!isOpen && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isOpen, mediaURL]);

  if (!isOpen || !mediaURL) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
          aria-label="Close media player"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Theme Playback</h3>
        <audio
          ref={audioRef}
          controls
          preload="auto"
          src={mediaURL}
          className="w-full h-14 bg-transparent border-none"
          key={mediaURL} // Force re-render if mediaURL changes while modal is open
        >
          Your browser does not support the audio element.
        </audio>
      </div>
    </div>
  );
}