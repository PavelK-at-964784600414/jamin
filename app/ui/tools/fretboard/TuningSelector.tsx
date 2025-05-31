// Tuning selector component

import { TUNINGS } from './constants';
import { TuningType } from './types';

interface TuningSelectorProps {
  selectedTuning: TuningType;
  onTuningChange: (tuning: TuningType) => void;
}

export default function TuningSelector({ selectedTuning, onTuningChange }: TuningSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Tuning
      </label>
      <select
        value={selectedTuning}
        onChange={(e) => onTuningChange(e.target.value as TuningType)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {Object.keys(TUNINGS).map((tuning) => (
          <option key={tuning} value={tuning}>
            {tuning}
          </option>
        ))}
      </select>
    </div>
  );
}
