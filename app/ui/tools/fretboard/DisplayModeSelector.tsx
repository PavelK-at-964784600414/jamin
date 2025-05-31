// Display mode selector component

import { DisplayMode } from './types';

interface DisplayModeSelectorProps {
  displayMode: DisplayMode;
  onDisplayModeChange: (mode: DisplayMode) => void;
}

export default function DisplayModeSelector({ displayMode, onDisplayModeChange }: DisplayModeSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Display Mode
      </label>
      <div className="flex space-x-2">
        <button
          onClick={() => onDisplayModeChange('scale')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            displayMode === 'scale'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Scales
        </button>
        <button
          onClick={() => onDisplayModeChange('chord')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            displayMode === 'chord'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Chords
        </button>
        <button
          onClick={() => onDisplayModeChange('progression')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            displayMode === 'progression'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Progressions
        </button>
      </div>
    </div>
  );
}
