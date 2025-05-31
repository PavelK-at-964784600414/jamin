// Legend component

import { DisplayMode } from './types';

interface LegendProps {
  displayMode: DisplayMode;
}

export default function Legend({ displayMode }: LegendProps) {
  return (
    <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mb-6 text-sm">
      <div className="flex items-center">
        <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
        <span className="text-gray-300">Root Notes</span>
      </div>
      <div className="flex items-center">
        <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
        <span className="text-gray-300">
          {displayMode === 'progression' ? 'Chord' : displayMode === 'scale' ? 'Scale' : 'Chord'} Notes
        </span>
      </div>
      {displayMode === 'progression' && (
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-600 rounded-lg mr-2"></div>
          <span className="text-gray-300">Current Chord (Playing)</span>
        </div>
      )}
      <div className="flex items-center">
        <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
        <span className="text-gray-300">Fret Markers</span>
      </div>
    </div>
  );
}
