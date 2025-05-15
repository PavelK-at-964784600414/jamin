import React from 'react';
import { MicrophoneIcon, VideoCameraIcon, PlayIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { Button } from '@/app/ui/button';

interface RecordingControlsProps {
  isRecording: boolean;
  isVideoMode: boolean;
  setIsVideoMode: (value: boolean) => void;
  metronomeEnabled: boolean;
  setMetronomeEnabled: (value: boolean) => void;
  onStartStopRecording: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  file: File | null;
}

export default function RecordingControls({
  isRecording,
  isVideoMode,
  setIsVideoMode,
  metronomeEnabled,
  setMetronomeEnabled,
  onStartStopRecording,
  onFileChange,
  file,
}: RecordingControlsProps) {
  return (
    <div className="rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 p-6 mt-6 shadow-2xl">
      {/* Recording Mode Section (Toggle) */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xl font-semibold text-white">Recording Mode</span>
        <Button
            type="button"
            onClick={() => setIsVideoMode(!isVideoMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
            isVideoMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-500'
            } text-white`}
        >
            {isVideoMode ? 'Video' : 'Audio'}
        </Button>
        </div>
      {/* Metronome Toggle */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-xl font-semibold text-white">Metronome</span>
        <Button
          type="button"
          onClick={() => setMetronomeEnabled(!metronomeEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
            metronomeEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'
          } text-white`}
        >
          {metronomeEnabled ? 'On' : 'Off'}
        </Button>
      </div>

      {/* Recording & File Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Button
            type="button"
            onClick={onStartStopRecording}
            className="flex items-center gap-2 px-5 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
          >
            {isRecording ? (
              <>
                <MicrophoneIcon className="h-6 w-6 bg-red 400" />
                Stop Recording
              </>
            ) : (
              <>
                <MicrophoneIcon className="h-6 w-6" />
                {isVideoMode ? 'Record Video' : 'Record Audio'}
              </>
            )}
          </Button>
          <input
            type="file"
            accept={isVideoMode ? 'video/*,audio/*' : 'audio/*'}
            onChange={onFileChange}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="flex items-center gap-2 cursor-pointer px-4 py-3 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors duration-200"
          >
            <PlayIcon className="h-6 w-6" />
            Upload File
          </label>
        </div>
        {/* We'll use form submission instead of a separate save button */}
      </div>
    </div>
  );
}