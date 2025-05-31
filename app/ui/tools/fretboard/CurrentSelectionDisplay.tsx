// Current selection display component

import { transposeProgression } from './utils';
import { DisplayMode, ScaleType, ChordType, ProgressionType, TuningType, Chord } from './types';
import { NOTES } from './constants';

interface CurrentSelectionDisplayProps {
  displayMode: DisplayMode;
  selectedRoot: string;
  selectedScale: ScaleType;
  selectedChord: ChordType;
  selectedProgression: ProgressionType;
  selectedTuning: TuningType;
  customTuning: string[];
  numStrings: number;
  intervals: number[];
  currentProgressionChord: Chord | null;
}

export default function CurrentSelectionDisplay({
  displayMode,
  selectedRoot,
  selectedScale,
  selectedChord,
  selectedProgression,
  selectedTuning,
  customTuning,
  numStrings,
  intervals,
  currentProgressionChord,
}: CurrentSelectionDisplayProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-6">
      <h4 className="text-white font-medium mb-2">Current Selection:</h4>
      {displayMode === 'progression' ? (
        <div>
          <p className="text-gray-300">
            <span className="text-blue-400">{selectedProgression.name}</span> progression in{' '}
            <span className="text-green-400">{selectedRoot}</span>{' '}
            on <span className="text-purple-400">{numStrings}-string {selectedTuning}</span>
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Chords: {transposeProgression(selectedProgression, selectedRoot).join(' - ')}
          </p>
          {currentProgressionChord && (
            <p className="text-gray-400 text-sm mt-1">
              Current chord notes: {currentProgressionChord.notes.join(' - ')}
            </p>
          )}
        </div>
      ) : (
        <div>
          <p className="text-gray-300">
            <span className="text-blue-400">{selectedRoot}</span>{' '}
            <span className="text-green-400">
              {displayMode === 'scale' ? selectedScale : selectedChord}
            </span>{' '}
            on <span className="text-purple-400">{numStrings}-string {selectedTuning}</span>
          </p>
          <p className="text-gray-400 text-sm mt-1">
            Notes: {intervals.map(interval => {
              const noteIndex = (NOTES.indexOf(selectedRoot) + interval) % 12;
              return NOTES[noteIndex];
            }).join(' - ')}
          </p>
        </div>
      )}
      {selectedTuning === 'Custom' && (
        <p className="text-gray-400 text-sm mt-1">
          Tuning: {customTuning.join(' - ')} (low to high)
        </p>
      )}
    </div>
  );
}
