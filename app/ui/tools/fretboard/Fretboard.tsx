// Fretboard display component

import { getNoteAtFret, isNoteInPattern, isRootNote, getIntervalName } from './utils';

interface FretboardProps {
  tuning: string[];
  numFrets: number;
  intervals: number[];
  currentRoot: string;
  showNoteNames: boolean;
  highlightRoot: boolean;
}

export default function Fretboard({
  tuning,
  numFrets,
  intervals,
  currentRoot,
  showNoteNames,
  highlightRoot,
}: FretboardProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-6 overflow-x-auto">
      {/* Fret numbers */}
      <div className="flex mb-2 ml-16">
        <div className="w-12 text-center text-gray-400 text-sm font-mono">Open</div>
        {Array.from({ length: numFrets }, (_, i) => (
          <div key={i} className="w-12 text-center text-gray-400 text-sm font-mono">
            {i + 1}
          </div>
        ))}
      </div>

      {/* Strings */}
      {[...tuning].reverse().map((stringNote, displayIndex) => {
        const stringIndex = tuning.length - 1 - displayIndex;
        return (
          <div key={stringIndex} className="flex items-center mb-1">
            {/* String name */}
            <div className="w-12 text-right pr-2 text-gray-300 font-mono font-bold">
              {stringNote}
            </div>
            
            {/* Frets */}
            <div className="flex">
              {/* Open string */}
              <div className="w-12 h-8 border-r border-gray-600 flex items-center justify-center relative">
                {isNoteInPattern(stringNote, currentRoot, intervals) && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isRootNote(stringNote, currentRoot) && highlightRoot
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {showNoteNames ? stringNote : getIntervalName(stringNote, currentRoot)}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400"></div>
              </div>

              {/* Frets */}
              {Array.from({ length: numFrets }, (_, fret) => {
                const fretNumber = fret + 1;
                const note = getNoteAtFret(stringNote, fretNumber);
                const isInPattern = isNoteInPattern(note, currentRoot, intervals);
                const isRoot = isRootNote(note, currentRoot);
                const isMarkerFret = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].includes(fretNumber);
                const isDotFret = [12, 24].includes(fretNumber);

                return (
                  <div
                    key={fret}
                    className={`w-12 h-8 border-r border-gray-600 flex items-center justify-center relative ${
                      isMarkerFret ? 'bg-gray-700' : ''
                    }`}
                  >
                    {/* Fret markers */}
                    {displayIndex === Math.floor(tuning.length / 2) && isMarkerFret && (
                      <div className={`absolute w-2 h-2 rounded-full ${
                        isDotFret ? 'bg-gray-400' : 'bg-gray-500'
                      } opacity-30`} style={{ top: '50%', transform: 'translateY(-50%)' }} />
                    )}

                    {/* Note circle */}
                    {isInPattern && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 ${
                        isRoot && highlightRoot
                          ? 'bg-red-500 text-white ring-2 ring-red-300'
                          : 'bg-blue-500 text-white'
                      }`}>
                        {showNoteNames ? note : getIntervalName(note, currentRoot)}
                      </div>
                    )}

                    {/* String line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400"></div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
