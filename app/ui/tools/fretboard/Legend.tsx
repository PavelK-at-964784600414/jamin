// Legend component

import { DisplayMode } from './types';

interface LegendProps {
  displayMode: DisplayMode;
  isProgressionPlaying?: boolean;
}

export default function Legend({ displayMode, isProgressionPlaying = false }: LegendProps) {
  return (
    <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-6 text-sm">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
        <span className="text-gray-300">Root Notes</span>
      </div>
      {displayMode === 'progression' && isProgressionPlaying && (
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-800 rounded-full mr-2"></div>
          <span className="text-gray-300">Root Notes (Background)</span>
        </div>
      )}
      <div className="flex items-center">
        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
        <span className="text-gray-300">
          {displayMode === 'progression' ? 'Scale' : displayMode === 'scale' ? 'Scale' : 'Chord'} Notes
        </span>
      </div>
      {displayMode === 'progression' && isProgressionPlaying && (
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-800 rounded-full mr-2"></div>
          <span className="text-gray-300">Scale Notes (Background)</span>
        </div>
      )}
      {displayMode === 'progression' && (
        <>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-600 rounded-lg mr-2"></div>
            <span className="text-gray-300">Current Chord (Playing)</span>
          </div>
          {isProgressionPlaying && (
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded-full mr-2 animate-pulse ring-2 ring-green-300"></div>
              <span className="text-gray-300">Active Chord Notes (Animated)</span>
            </div>
          )}
        </>
      )}
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
        <span className="text-gray-300">Fret Markers</span>
      </div>
    </div>
  );
}
