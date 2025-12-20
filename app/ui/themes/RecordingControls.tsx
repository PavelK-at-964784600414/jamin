import React from 'react';
import { MicrophoneIcon, VideoCameraIcon, ArrowUpTrayIcon, StopIcon } from '@heroicons/react/24/outline';

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
    <div className="bg-gradient-to-br from-indigo-800 to-purple-700 rounded-xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <span className="bg-red-500 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">4</span>
        Record Your Theme
      </h3>
      
      {/* Quick Settings */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
          <span className="text-white text-sm">Recording Mode</span>
          <button
            type="button"
            onClick={() => setIsVideoMode(!isVideoMode)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isVideoMode 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {isVideoMode ? 'Video' : 'Audio'}
          </button>
        </div>
        <div className="flex items-center justify-between p-3 bg-black/20 rounded-lg">
          <span className="text-white text-sm">Metronome</span>
          <button
            type="button"
            onClick={() => setMetronomeEnabled(!metronomeEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              metronomeEnabled 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {metronomeEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Recording Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <button
          type="button"
          onClick={onStartStopRecording}
          className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${
            isRecording
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/25'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg shadow-blue-500/25'
          }`}
        >
          {isRecording ? (
            <>
              <StopIcon className="w-5 h-5" />
              Stop Recording
            </>
          ) : (
            <>
              {isVideoMode ? <VideoCameraIcon className="w-5 h-5" /> : <MicrophoneIcon className="w-5 h-5" />}
              {isVideoMode ? 'Record Video' : 'Record Audio'}
            </>
          )}
        </button>

        <div className="text-white text-sm">OR</div>

        <div className="relative">
          <input
            type="file"
            accept={isVideoMode ? 'video/*,audio/*' : 'audio/*'}
            onChange={onFileChange}
            className="hidden"
            id="file-input"
          />
          <label
            htmlFor="file-input"
            className="flex items-center gap-2 cursor-pointer px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-medium transition-all transform hover:scale-105 shadow-lg shadow-green-500/25"
          >
            <ArrowUpTrayIcon className="w-5 h-5" />
            Upload File
          </label>
        </div>
      </div>

      {/* File Status */}
      {file && (
        <div className="mt-4 p-3 bg-black/20 rounded-lg">
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">File ready: {file.name}</span>
          </div>
        </div>
      )}
    </div>
  );
}