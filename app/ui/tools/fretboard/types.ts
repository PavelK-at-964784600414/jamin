// Type definitions for the fretboard visualizer

import { SCALES, CHORDS, TUNINGS, COMMON_PROGRESSIONS } from './constants';

export type DisplayMode = 'scale' | 'chord' | 'progression';

export type SoundType = 'piano' | 'drums';

export interface Chord {
  root: string;
  type: string;
  notes: string[];
}

export type ScaleType = keyof typeof SCALES;
export type ChordType = keyof typeof CHORDS;
export type TuningType = keyof typeof TUNINGS;
export type ProgressionType = typeof COMMON_PROGRESSIONS[0];
