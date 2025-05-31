// Musical data constants for the fretboard visualizer

export const SCALES = {
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

export const CHORDS = {
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

export const CHORD_TYPES = [
  { name: 'Major', symbol: '', intervals: [0, 4, 7] },
  { name: 'Minor', symbol: 'm', intervals: [0, 3, 7] },
  { name: 'Dominant 7th', symbol: '7', intervals: [0, 4, 7, 10] },
  { name: 'Major 7th', symbol: 'maj7', intervals: [0, 4, 7, 11] },
  { name: 'Minor 7th', symbol: 'm7', intervals: [0, 3, 7, 10] },
  { name: 'Diminished', symbol: 'dim', intervals: [0, 3, 6] },
  { name: 'Augmented', symbol: 'aug', intervals: [0, 4, 8] },
  { name: 'Sus2', symbol: 'sus2', intervals: [0, 2, 7] },
  { name: 'Sus4', symbol: 'sus4', intervals: [0, 5, 7] },
];

export const COMMON_PROGRESSIONS = [
  { name: 'I-V-vi-IV', chords: ['C', 'G', 'Am', 'F'] },
  { name: 'vi-IV-I-V', chords: ['Am', 'F', 'C', 'G'] },
  { name: 'I-vi-IV-V', chords: ['C', 'Am', 'F', 'G'] },
  { name: 'ii-V-I', chords: ['Dm', 'G', 'C'] },
  { name: 'I-IV-V-I', chords: ['C', 'F', 'G', 'C'] },
];

export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const TUNINGS = {
  '6-String Standard': ['E', 'A', 'D', 'G', 'B', 'E'],
  '6-String Drop D': ['D', 'A', 'D', 'G', 'B', 'E'],
  '6-String Open G': ['D', 'G', 'D', 'G', 'B', 'D'],
  '6-String Open A': ['E', 'A', 'E', 'A', 'C#', 'E'],
  '6-String DADGAD': ['D', 'A', 'D', 'G', 'A', 'D'],
  '7-String Standard': ['B', 'E', 'A', 'D', 'G', 'B', 'E'],
  '7-String Drop A': ['A', 'E', 'A', 'D', 'G', 'B', 'E'],
  '8-String Standard': ['F#', 'B', 'E', 'A', 'D', 'G', 'B', 'E'],
  '8-String Drop E': ['E', 'B', 'E', 'A', 'D', 'G', 'B', 'E'],
  'Custom': [],
};
