// Custom tuning controls component

import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { NOTES } from './constants';

interface CustomTuningControlsProps {
  customTuning: string[];
  onCustomTuningChange: (index: number, note: string) => void;
}

export default function CustomTuningControls({ customTuning, onCustomTuningChange }: CustomTuningControlsProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h4 className="text-white font-medium mb-3 flex items-center">
        <AdjustmentsHorizontalIcon className="w-4 h-4 mr-2" />
        Custom Tuning - Individual String Notes
      </h4>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {customTuning.map((note, index) => (
          <div key={index} className="flex flex-col">
            <label className="text-xs text-gray-400 mb-1">
              String {index + 1} ({index === 0 ? 'Lowest/Thickest' : index === customTuning.length - 1 ? 'Highest/Thinnest' : ''})
            </label>
            <select
              value={note}
              onChange={(e) => onCustomTuningChange(index, e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {NOTES.map((noteOption) => (
                <option key={noteOption} value={noteOption}>
                  {noteOption}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Tip: Strings are ordered from lowest/thickest (top of fretboard) to highest/thinnest (bottom of fretboard)
      </p>
    </div>
  );
}
