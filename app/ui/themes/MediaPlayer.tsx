import React from 'react';

interface MediaPlayerProps {
  mediaURL: string;
  isVideoMode: boolean;
  isValidBlobUrl: (url: string) => boolean;
  onPlayMedia: () => void;
}

const isValidBlobUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === 'blob:';
  } catch (e) {
    return false;
  }
};

export default function MediaPlayer({ mediaURL, isVideoMode, isValidBlobUrl, onPlayMedia }: MediaPlayerProps) {
  if (!mediaURL || !isValidBlobUrl(mediaURL)) return null;
  console.log(mediaURL);
  return (
    <div className="mt-4">
      {isVideoMode ? (
        <video
          controls
          preload="auto"
          src={mediaURL}
          className="w-full h-56 object-contain bg-transparent border-none"
        >
          Your browser does not support the video element.
        </video>
      ) : (
        <video
          controls
          preload="auto"
          src={mediaURL}
          className="w-full h-14 object-contain bg-transparent border-none"
        >
          Your browser does not support the audio element.
        </video>
      )}
      <button
        onClick={onPlayMedia}
        className="mt-2 bg-yellow-600 text-white hover:bg-yellow-700 w-full py-2 flex items-center justify-center gap-2"
      >
        Play Recording
      </button>
    </div>
  );
}