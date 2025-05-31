// Utility functions for fretboard calculations and musical operations

import { NOTES, CHORD_TYPES } from './constants';
import { Chord, ProgressionType } from './types';

export const getNoteAtFret = (stringNote: string, fret: number): string => {
  const stringIndex = NOTES.indexOf(stringNote);
  const noteIndex = (stringIndex + fret) % 12;
  return NOTES[noteIndex] ?? 'C'; // Fallback to C if index is invalid
};

export const isNoteInPattern = (note: string, currentRoot: string, intervals: number[]): boolean => {
  const rootIndex = NOTES.indexOf(currentRoot);
  const noteIndex = NOTES.indexOf(note);
  const interval = (noteIndex - rootIndex + 12) % 12;
  return intervals.includes(interval);
};

export const isRootNote = (note: string, currentRoot: string): boolean => {
  return note === currentRoot;
};

export const getIntervalName = (note: string, currentRoot: string): string => {
  const rootIndex = NOTES.indexOf(currentRoot);
  const noteIndex = NOTES.indexOf(note);
  const interval = (noteIndex - rootIndex + 12) % 12;
  
  const intervalNames = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', 'b6', '6', 'b7', '7'];
  return intervalNames[interval] ?? 'R'; // Fallback to root if index is invalid
};

export const generateChord = (root: string, chordType: typeof CHORD_TYPES[0]): Chord => {
  const rootIndex = NOTES.indexOf(root);
  const notes = chordType.intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTES[noteIndex] ?? 'C'; // Fallback to C if index is invalid
  }).filter((note): note is string => note !== undefined); // Filter out any undefined values

  return {
    root,
    type: chordType.name,
    notes,
  };
};

export const transposeProgression = (progression: ProgressionType, newKey: string): string[] => {
  const keyIndex = NOTES.indexOf(newKey);
  const cIndex = NOTES.indexOf('C');
  const interval = (keyIndex - cIndex + 12) % 12;

  return progression.chords.map(chord => {
    const isMinor = chord.includes('m') && !chord.includes('maj');
    const rootNote = chord.replace(/[^A-G#]/g, '');
    const rootIndex = NOTES.indexOf(rootNote);
    const newRootIndex = (rootIndex + interval) % 12;
    const newRoot = NOTES[newRootIndex] ?? 'C'; // Fallback to C if index is invalid
    
    return isMinor ? newRoot + 'm' : newRoot;
  }).filter((chord): chord is string => chord !== undefined); // Filter out any undefined values
};
