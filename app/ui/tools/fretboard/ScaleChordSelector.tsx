// Scale/Chord/Progression selector component

import { SCALES, CHORDS, COMMON_PROGRESSIONS } from './constants';
import { DisplayMode, ScaleType, ChordType, ProgressionType } from './types';

interface ScaleChordSelectorProps {
  displayMode: DisplayMode;
  selectedScale: ScaleType;
  selectedChord: ChordType;
  selectedProgression: ProgressionType;
  onScaleChange: (scale: ScaleType) => void;
  onChordChange: (chord: ChordType) => void;
  onProgressionChange: (progression: ProgressionType) => void;
}

export default function ScaleChordSelector({
  displayMode,
  selectedScale,
  selectedChord,
  selectedProgression,
  onScaleChange,
  onChordChange,
  onProgressionChange,
}: ScaleChordSelectorProps) {
  const handleSelectionChange = (value: string) => {
    if (displayMode === 'scale') {
      onScaleChange(value as ScaleType);
    } else if (displayMode === 'chord') {
      onChordChange(value as ChordType);
    } else {
      const progression = COMMON_PROGRESSIONS.find(p => p.name === value);
      if (progression) {
        onProgressionChange(progression);
      }
    }
  };

  const getOptions = () => {
    if (displayMode === 'scale') {
      return Object.keys(SCALES);
    } else if (displayMode === 'chord') {
      return Object.keys(CHORDS);
    } else {
      return COMMON_PROGRESSIONS.map(p => p.name);
    }
  };

  const getCurrentValue = () => {
    if (displayMode === 'scale') {
      return selectedScale;
    } else if (displayMode === 'chord') {
      return selectedChord;
    } else {
      return selectedProgression.name;
    }
  };

  const getLabel = () => {
    if (displayMode === 'scale') return 'Scale';
    if (displayMode === 'chord') return 'Chord';
    return 'Progression';
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {getLabel()}
      </label>
      <select
        value={getCurrentValue()}
        onChange={(e) => handleSelectionChange(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {getOptions().map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
