'use client';

import { useState, useCallback } from 'react';
import { MusicalNoteIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';

// Guitar scales and chords data
const SCALES = {
  'Major (Ionian)': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor (Aeolian)': [0, 2, 3, 5, 7, 8, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
  'Chromatic': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

const CHORDS = {
  'Major': [0, 4, 7],
  'Minor': [0, 3, 7],
  'Diminished': [0, 3, 6],
  'Augmented': [0, 4, 8],
  'Sus2': [0, 2, 7],
  'Sus4': [0, 5, 7],
  'Major 7': [0, 4, 7, 11],
  'Minor 7': [0, 3, 7, 10],
  'Dominant 7': [0, 4, 7, 10],
  'Major 9': [0, 4, 7, 11, 14],
  'Minor 9': [0, 3, 7, 10, 14],
  'Add 9': [0, 4, 7, 14],
};

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Guitar tunings
const TUNINGS = {
  '6-String Standard': ['E', 'A', 'D', 'G', 'B', 'E'],
  '6-String Drop D': ['D', 'A', 'D', 'G', 'B', 'E'],
  '6-String Open G': ['D', 'G', 'D', 'G', 'B', 'D'],
  '6-String Open A': ['E', 'A', 'E', 'A', 'C#', 'E'],
  '6-String DADGAD': ['D', 'A', 'D', 'G', 'A', 'D'],
  '7-String Standard': ['B', 'E', 'A', 'D', 'G', 'B', 'E'],
  '7-String Drop A': ['A', 'E', 'A', 'D', 'G', 'B', 'E'],
  '8-String Standard': ['F#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'],
  '8-String Drop E': ['E', 'B', 'E', 'A', 'D', 'G', 'B', 'E'],
  'Custom': [], // Will be handled separately
};

type DisplayMode = 'scale' | 'chord';

export default function FretboardVisualizer() {
  const [selectedTuning, setSelectedTuning] = useState<keyof typeof TUNINGS>('6-String Standard');
  const [customTuning, setCustomTuning] = useState<string[]>(['E', 'A', 'D', 'G', 'B', 'E']);
  const [numStrings, setNumStrings] = useState(6);
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedScale, setSelectedScale] = useState<keyof typeof SCALES>('Major (Ionian)');
  const [selectedChord, setSelectedChord] = useState<keyof typeof CHORDS>('Major');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('scale');
  const [numFrets, setNumFrets] = useState(12);
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [highlightRoot, setHighlightRoot] = useState(true);

  const tuning = selectedTuning === 'Custom' ? customTuning : TUNINGS[selectedTuning];
  const intervals = displayMode === 'scale' ? SCALES[selectedScale] : CHORDS[selectedChord];

  // Update numStrings when tuning changes
  const updateTuningAndStrings = (newTuning: keyof typeof TUNINGS) => {
    setSelectedTuning(newTuning);
    
    if (newTuning !== 'Custom') {
      const tuningArray = TUNINGS[newTuning];
      setNumStrings(tuningArray.length);
      setCustomTuning([...tuningArray]); // Keep custom tuning in sync
    }
  };

  const updateCustomTuning = (stringIndex: number, note: string) => {
    const newTuning = [...customTuning];
    newTuning[stringIndex] = note;
    setCustomTuning(newTuning);
  };

  const adjustStringCount = (newCount: number) => {
    setNumStrings(newCount);
    
    // Start with current custom tuning
    let newCustomTuning = [...customTuning];
    
    if (newCount > newCustomTuning.length) {
      // Add strings to the beginning (lower strings)
      const stringsToAdd = newCount - newCustomTuning.length;
      
      if (newCount === 7 && newCustomTuning.length === 6) {
        // Add standard 7-string low B
        newCustomTuning.unshift('B');
      } else if (newCount === 8 && newCustomTuning.length === 6) {
        // Add both F# and B for 8-string from 6-string
        newCustomTuning.unshift('B', 'F#');
      } else if (newCount === 8 && newCustomTuning.length === 7) {
        // Add F# for 8-string from 7-string
        newCustomTuning.unshift('F#');
      } else {
        // Generic case: add default notes
        const defaultNotes = ['F#', 'B', 'E', 'A', 'D'];
        for (let i = 0; i < stringsToAdd; i++) {
          const noteIndex = Math.min(i, defaultNotes.length - 1);
          newCustomTuning.unshift(defaultNotes[noteIndex] || 'E');
        }
      }
    } else if (newCount < newCustomTuning.length) {
      // Remove strings from the beginning (remove lowest strings)
      newCustomTuning.splice(0, newCustomTuning.length - newCount);
    }
    
    setCustomTuning(newCustomTuning);
    
    // Switch to Custom tuning when manually adjusting string count
    setSelectedTuning('Custom');
  };

  const getNoteAtFret = useCallback((stringNote: string, fret: number) => {
    const stringIndex = NOTES.indexOf(stringNote);
    return NOTES[(stringIndex + fret) % 12];
  }, []);

  const isNoteInPattern = useCallback((note: string) => {
    const rootIndex = NOTES.indexOf(selectedRoot);
    const noteIndex = NOTES.indexOf(note);
    const interval = (noteIndex - rootIndex + 12) % 12;
    return intervals.includes(interval);
  }, [selectedRoot, intervals]);

  const isRootNote = useCallback((note: string) => {
    return note === selectedRoot;
  }, [selectedRoot]);

  const getIntervalName = useCallback((note: string) => {
    const rootIndex = NOTES.indexOf(selectedRoot);
    const noteIndex = NOTES.indexOf(note);
    const interval = (noteIndex - rootIndex + 12) % 12;
    
    const intervalNames = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
    return intervalNames[interval];
  }, [selectedRoot]);

  const renderFretboard = () => {
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
          const stringIndex = tuning.length - 1 - displayIndex; // Convert display index to actual string index
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
                {isNoteInPattern(stringNote) && (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isRootNote(stringNote) && highlightRoot
                      ? 'bg-red-500 text-white'
                      : 'bg-blue-500 text-white'
                  }`}>
                    {showNoteNames ? stringNote : getIntervalName(stringNote)}
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-400"></div>
              </div>

              {/* Frets */}
              {Array.from({ length: numFrets }, (_, fret) => {
                const fretNumber = fret + 1;
                const note = getNoteAtFret(stringNote, fretNumber);
                const isInPattern = isNoteInPattern(note);
                const isRoot = isRootNote(note);
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
                        {showNoteNames ? note : getIntervalName(note)}
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
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MusicalNoteIcon className="w-5 h-5 mr-2" />
          Interactive Fretboard Visualizer
        </h3>
        
        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Display Mode */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Mode
            </label>
            <div className="flex space-x-2">
              <button
                onClick={() => setDisplayMode('scale')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  displayMode === 'scale'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Scales
              </button>
              <button
                onClick={() => setDisplayMode('chord')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  displayMode === 'chord'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Chords
              </button>
            </div>
          </div>

          {/* Root Note */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Root Note
            </label>
            <select
              value={selectedRoot}
              onChange={(e) => setSelectedRoot(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {NOTES.map((note) => (
                <option key={note} value={note}>
                  {note}
                </option>
              ))}
            </select>
          </div>

          {/* Scale/Chord Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {displayMode === 'scale' ? 'Scale' : 'Chord'}
            </label>
            <select
              value={displayMode === 'scale' ? selectedScale : selectedChord}
              onChange={(e) => {
                if (displayMode === 'scale') {
                  setSelectedScale(e.target.value as keyof typeof SCALES);
                } else {
                  setSelectedChord(e.target.value as keyof typeof CHORDS);
                }
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {displayMode === 'scale'
                ? Object.keys(SCALES).map((scale) => (
                    <option key={scale} value={scale}>
                      {scale}
                    </option>
                  ))
                : Object.keys(CHORDS).map((chord) => (
                    <option key={chord} value={chord}>
                      {chord}
                    </option>
                  ))
              }
            </select>
          </div>

          {/* Tuning */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tuning
            </label>
            <select
              value={selectedTuning}
              onChange={(e) => updateTuningAndStrings(e.target.value as keyof typeof TUNINGS)}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Object.keys(TUNINGS).map((tuning) => (
                <option key={tuning} value={tuning}>
                  {tuning}
                </option>
              ))}
            </select>
          </div>

          {/* Number of Strings */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Strings
            </label>
            <div className="flex space-x-2">
              {[6, 7, 8].map((count) => (
                <button
                  key={count}
                  onClick={() => adjustStringCount(count)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    numStrings === count
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Number of Frets */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Frets to Show
            </label>
            <select
              value={numFrets}
              onChange={(e) => setNumFrets(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={12}>12 Frets</option>
              <option value={15}>15 Frets</option>
              <option value={18}>18 Frets</option>
              <option value={21}>21 Frets</option>
              <option value={24}>24 Frets</option>
            </select>
          </div>

          {/* Display Options */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Options
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showNoteNames}
                  onChange={(e) => setShowNoteNames(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-300">Show Note Names</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={highlightRoot}
                  onChange={(e) => setHighlightRoot(e.target.checked)}
                  className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-300">Highlight Root Notes</span>
              </label>
            </div>
          </div>
        </div>

        {/* Custom Tuning Controls */}
        {selectedTuning === 'Custom' && (
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
                    onChange={(e) => updateCustomTuning(index, e.target.value)}
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
        )}

        {/* Current Selection Display */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <h4 className="text-white font-medium mb-2">Current Selection:</h4>
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
          {selectedTuning === 'Custom' && (
            <p className="text-gray-400 text-sm mt-1">
              Tuning: {customTuning.join(' - ')} (low to high)
            </p>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center space-x-6 mb-6 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
            <span className="text-gray-300">Root Notes</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
            <span className="text-gray-300">{displayMode === 'scale' ? 'Scale' : 'Chord'} Notes</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
            <span className="text-gray-300">Fret Markers</span>
          </div>
        </div>

        {/* Fretboard */}
        {renderFretboard()}
      </div>
    </div>
  );
}
