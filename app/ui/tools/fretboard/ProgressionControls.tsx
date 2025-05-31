// Chord progression controls component

import { PlayIcon, StopIcon } from '@heroicons/react/24/outline';
import { transposeProgression } from './utils';
import { ProgressionType, Chord, SoundType } from './types';

interface ProgressionControlsProps {
  selectedProgression: ProgressionType;
  selectedRoot: string;
  isProgressionPlaying: boolean;
  currentChordIndex: number;
  currentProgressionChord: Chord | null;
  bpm: number;
  soundType: SoundType;
  onPlayProgression: () => void;
  onStopProgression: () => void;
  onBpmChange: (bpm: number) => void;
  onSoundTypeChange: (soundType: SoundType) => void;
}

export default function ProgressionControls({
  selectedProgression,
  selectedRoot,
  isProgressionPlaying,
  currentChordIndex,
  currentProgressionChord,
  bpm,
  soundType,
  onPlayProgression,
  onStopProgression,
  onBpmChange,
  onSoundTypeChange,
}: ProgressionControlsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h4 className="text-white font-medium mb-3 flex items-center">
        <PlayIcon className="w-4 h-4 mr-2" />
        Chord Progression Playback
      </h4>
      
      {/* Progression Visualization */}
      <div className="mb-4">
        <h5 className="text-sm font-medium text-gray-300 mb-2">Current Progression:</h5>
        <div className="flex flex-wrap gap-2">
          {selectedProgression.chords.map((chord, index) => {
            const transposedChords = transposeProgression(selectedProgression, selectedRoot);
            const transposedChord = transposedChords[index];
            const isCurrentChord = isProgressionPlaying && currentChordIndex === index;
            
            return (
              <div
                key={index}
                className={`px-3 py-2 rounded-lg border transition-all duration-300 ${
                  isCurrentChord
                    ? 'bg-green-600 border-green-400 text-white shadow-lg transform scale-105'
                    : 'bg-gray-700 border-gray-600 text-gray-300'
                }`}
              >
                <div className="text-sm font-medium">{transposedChord}</div>
                <div className="text-xs opacity-75">{index + 1}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center space-x-4 mb-4">
        <button
          onClick={onPlayProgression}
          disabled={isProgressionPlaying}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            isProgressionPlaying
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <PlayIcon className="w-4 h-4 mr-2" />
          Play
        </button>
        
        <button
          onClick={onStopProgression}
          disabled={!isProgressionPlaying}
          className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
            !isProgressionPlaying
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          <StopIcon className="w-4 h-4 mr-2" />
          Stop
        </button>

        {/* Sound Type Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
            Sound:
          </label>
          <select
            value={soundType}
            onChange={(e) => onSoundTypeChange(e.target.value as SoundType)}
            className="bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 px-3 py-2"
          >
            <option value="piano">Piano</option>
            <option value="drums">Drums & Bass</option>
          </select>
        </div>
      </div>

      {/* BPM Control */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-300 whitespace-nowrap">
          BPM:
        </label>
        <input
          type="range"
          min="60"
          max="200"
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm text-gray-300 font-mono w-12 text-center">
          {bpm}
        </span>
      </div>

      {/* Current Chord Info */}
      {isProgressionPlaying && currentProgressionChord && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm text-gray-300">Now Playing:</span>
              <span className="ml-2 text-lg font-bold text-green-400">
                {currentProgressionChord.root + (currentProgressionChord.type.includes('Minor') ? 'm' : '')}
              </span>
            </div>
            <div className="text-sm text-gray-400">
              Chord {currentChordIndex + 1} of {selectedProgression.chords.length}
            </div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Notes: {currentProgressionChord.notes.join(' - ')}
          </div>
          <div className="text-xs text-blue-400 mt-2 flex items-center">
            <div className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></div>
            Playing in loop - Click Stop to end
          </div>
        </div>
      )}
    </div>
  );
}
