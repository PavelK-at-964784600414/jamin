'use client';

import { useState, useRef, useEffect } from 'react';
import { MusicalNoteIcon, PlayIcon, PauseIcon, StopIcon } from '@heroicons/react/24/outline';

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const CHORD_TYPES = [
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

const COMMON_PROGRESSIONS = [
  { name: 'I-V-vi-IV', chords: ['C', 'G', 'Am', 'F'] },
  { name: 'vi-IV-I-V', chords: ['Am', 'F', 'C', 'G'] },
  { name: 'I-vi-IV-V', chords: ['C', 'Am', 'F', 'G'] },
  { name: 'ii-V-I', chords: ['Dm', 'G', 'C'] },
  { name: 'I-IV-V-I', chords: ['C', 'F', 'G', 'C'] },
];

// Drum patterns (1 = hit, 0 = rest) - 16th note patterns
const DRUM_PATTERNS = {
  'Rock': {
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
  },
  'Pop': {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hihat: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
  },
  'Funk': {
    kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1],
    hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
  },
  'Jazz': {
    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    hihat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
  },
};

// Bass patterns - root and chord tones
const BASS_PATTERNS = {
  'Root': {
    pattern: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], // On beats 1 and 3
    notes: 'root', // Play root note
  },
  'Walking': {
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], // Quarter notes
    notes: 'walking', // Root, 3rd, 5th, 7th
  },
  'Syncopated': {
    pattern: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
    notes: 'root',
  },
  'Eighth Note': {
    pattern: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    notes: 'root',
  },
};

interface Chord {
  root: string;
  type: string;
  notes: string[];
}

export default function ChordGenerator() {
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedType, setSelectedType] = useState(CHORD_TYPES[0]);
  const [currentChord, setCurrentChord] = useState<Chord | null>(null);
  const [selectedProgression, setSelectedProgression] = useState(COMMON_PROGRESSIONS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isProgressionPlaying, setIsProgressionPlaying] = useState(false);
  const [selectedDrumPattern, setSelectedDrumPattern] = useState('Rock');
  const [selectedBassPattern, setSelectedBassPattern] = useState('Root');
  const [bpm, setBpm] = useState(120);
  const [includeChords, setIncludeChords] = useState(true);
  const [includeDrums, setIncludeDrums] = useState(true);
  const [includeBass, setIncludeBass] = useState(true);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const progressionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (progressionTimeoutRef.current) {
        clearTimeout(progressionTimeoutRef.current);
      }
    };
  }, []);

  const generateChord = (root: string, chordType: typeof CHORD_TYPES[0]) => {
    const rootIndex = NOTES.indexOf(root);
    const notes = chordType.intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });

    return {
      root,
      type: chordType.name,
      notes,
    };
  };

  const handleGenerateChord = () => {
    const chord = generateChord(selectedRoot, selectedType);
    setCurrentChord(chord);
  };

  const transposeProgression = (progression: typeof COMMON_PROGRESSIONS[0], newKey: string) => {
    const keyIndex = NOTES.indexOf(newKey);
    const cIndex = NOTES.indexOf('C');
    const interval = (keyIndex - cIndex + 12) % 12;

    return progression.chords.map(chord => {
      // Simple transposition for major/minor chords
      const isMinor = chord.includes('m') && !chord.includes('maj');
      const rootNote = chord.replace(/[^A-G#]/g, '');
      const rootIndex = NOTES.indexOf(rootNote);
      const newRootIndex = (rootIndex + interval) % 12;
      const newRoot = NOTES[newRootIndex];
      
      return isMinor ? newRoot + 'm' : newRoot;
    });
  };

  const playChord = () => {
    if (!audioContextRef.current || !currentChord) return;
    
    setIsPlaying(true);
    const context = audioContextRef.current;
    
    // Note frequencies (C4 = 261.63 Hz)
    const noteFrequencies: Record<string, number> = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };
    
    const duration = 2; // 2 seconds
    const now = context.currentTime;
    
    // Create oscillators for each note in the chord
    currentChord.notes.forEach((note, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      // Set frequency for this note
      const frequency = noteFrequencies[note] || 440;
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      // Set volume envelope
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.1, now + 0.1); // Fade in
      gainNode.gain.linearRampToValueAtTime(0.08, now + duration - 0.3); // Sustain
      gainNode.gain.linearRampToValueAtTime(0, now + duration); // Fade out
      
      oscillator.start(now);
      oscillator.stop(now + duration);
    });
    
    // Reset playing state after duration
    setTimeout(() => setIsPlaying(false), duration * 1000);
  };

  // Create drum sounds using Web Audio API
  const createDrumSound = (frequency: number, duration: number, type: 'kick' | 'snare' | 'hihat', startTime: number) => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    
    if (type === 'kick') {
      // Kick drum - low frequency sine wave with quick decay
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.setValueAtTime(60, startTime);
      oscillator.frequency.exponentialRampToValueAtTime(40, startTime + 0.1);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.8, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    } else if (type === 'snare') {
      // Snare drum - noise burst with filter
      const bufferSize = context.sampleRate * 0.1;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const output = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const noise = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gainNode = context.createGain();
      
      noise.buffer = buffer;
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);
      
      filter.type = 'highpass';
      filter.frequency.value = 1000;
      
      gainNode.gain.setValueAtTime(0.5, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.1);
      
      noise.start(startTime);
      noise.stop(startTime + 0.1);
    } else if (type === 'hihat') {
      // Hi-hat - high frequency noise burst
      const bufferSize = context.sampleRate * 0.05;
      const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
      const output = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      
      const noise = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gainNode = context.createGain();
      
      noise.buffer = buffer;
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(context.destination);
      
      filter.type = 'highpass';
      filter.frequency.value = 8000;
      
      gainNode.gain.setValueAtTime(0.3, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.05);
      
      noise.start(startTime);
      noise.stop(startTime + 0.05);
    }
  };

  // Create bass sound
  const createBassSound = (frequency: number, startTime: number, duration: number) => {
    if (!audioContextRef.current) return;
    
    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = frequency / 2; // One octave lower
    oscillator.type = 'sawtooth';
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0.2, startTime + duration - 0.1);
    gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  };

  // Get bass note frequencies for a chord
  const getBassNotes = (chordRoot: string, pattern: string) => {
    const noteFrequencies: Record<string, number> = {
      'C': 65.41, 'C#': 69.30, 'D': 73.42, 'D#': 77.78,
      'E': 82.41, 'F': 87.31, 'F#': 92.50, 'G': 98.00,
      'G#': 103.83, 'A': 110.00, 'A#': 116.54, 'B': 123.47
    };
    
    const rootNote = chordRoot.replace(/[^A-G#]/g, '');
    const rootFreq = noteFrequencies[rootNote];
    
    if (pattern === 'walking') {
      // Return root, 3rd, 5th for walking bass
      const rootIndex = NOTES.indexOf(rootNote);
      const thirdIndex = (rootIndex + 2) % 12;
      const fifthIndex = (rootIndex + 4) % 12;
      
      return [
        noteFrequencies[NOTES[rootIndex]],
        noteFrequencies[NOTES[thirdIndex]],
        noteFrequencies[NOTES[fifthIndex]],
        rootFreq
      ];
    }
    
    return [rootFreq]; // Just root for other patterns
  };

  // Play chord progression with drums and bass
  const playProgression = () => {
    if (!audioContextRef.current) return;
    
    setIsProgressionPlaying(true);
    const context = audioContextRef.current;
    const now = context.currentTime;
    
    // Calculate timing
    const beatDuration = 60 / bpm; // Duration of one quarter note
    const sixteenthDuration = beatDuration / 4; // Duration of one 16th note
    const chordDuration = beatDuration * 4; // Each chord lasts 4 beats
    
    const transposedChords = transposeProgression(selectedProgression, selectedRoot);
    const drumPattern = DRUM_PATTERNS[selectedDrumPattern as keyof typeof DRUM_PATTERNS];
    const bassPattern = BASS_PATTERNS[selectedBassPattern as keyof typeof BASS_PATTERNS];
    
    transposedChords.forEach((chord, chordIndex) => {
      const chordStartTime = now + (chordIndex * chordDuration);
      
      // Play chord if enabled
      if (includeChords) {
        const chordObj = generateChord(chord.replace(/[^A-G#]/g, ''), 
          chord.includes('m') && !chord.includes('maj') ? CHORD_TYPES[1] : CHORD_TYPES[0]);
        
        const noteFrequencies: Record<string, number> = {
          'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
          'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
          'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
        };
        
        chordObj.notes.forEach((note) => {
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          
          const frequency = noteFrequencies[note] || 440;
          oscillator.frequency.value = frequency;
          oscillator.type = 'sine';
          
          gainNode.gain.setValueAtTime(0, chordStartTime);
          gainNode.gain.linearRampToValueAtTime(0.05, chordStartTime + 0.1);
          gainNode.gain.linearRampToValueAtTime(0.03, chordStartTime + chordDuration - 0.3);
          gainNode.gain.linearRampToValueAtTime(0, chordStartTime + chordDuration);
          
          oscillator.start(chordStartTime);
          oscillator.stop(chordStartTime + chordDuration);
        });
      }
      
      // Play drums and bass for each 16th note in the measure
      for (let i = 0; i < 16; i++) {
        const noteTime = chordStartTime + (i * sixteenthDuration);
        
        // Play drums if enabled
        if (includeDrums) {
          if (drumPattern.kick[i]) {
            createDrumSound(60, sixteenthDuration, 'kick', noteTime);
          }
          if (drumPattern.snare[i]) {
            createDrumSound(200, sixteenthDuration, 'snare', noteTime);
          }
          if (drumPattern.hihat[i]) {
            createDrumSound(8000, sixteenthDuration, 'hihat', noteTime);
          }
        }
        
        // Play bass if enabled
        if (includeBass && bassPattern.pattern[i]) {
          const bassNotes = getBassNotes(chord, bassPattern.notes);
          let bassNote = bassNotes[0];
          
          if (bassPattern.notes === 'walking' && bassNotes.length > 1) {
            bassNote = bassNotes[Math.floor(i / 4) % bassNotes.length];
          }
          
          createBassSound(bassNote, noteTime, sixteenthDuration * 2);
        }
      }
    });
    
    // Reset playing state after progression completes
    const totalDuration = transposedChords.length * chordDuration * 1000;
    progressionTimeoutRef.current = setTimeout(() => {
      setIsProgressionPlaying(false);
    }, totalDuration);
  };

  const stopProgression = () => {
    setIsProgressionPlaying(false);
    if (progressionTimeoutRef.current) {
      clearTimeout(progressionTimeoutRef.current);
    }
  };

  return (
    <div className="space-y-8">
      {/* Individual Chord Generator */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <MusicalNoteIcon className="w-5 h-5 mr-2" />
          Chord Generator
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Root Note
              </label>
              <select
                value={selectedRoot}
                onChange={(e) => setSelectedRoot(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NOTES.map(note => (
                  <option key={note} value={note}>{note}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Chord Type
              </label>
              <select
                value={selectedType.name}
                onChange={(e) => {
                  const type = CHORD_TYPES.find(t => t.name === e.target.value);
                  if (type) setSelectedType(type);
                }}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CHORD_TYPES.map(type => (
                  <option key={type.name} value={type.name}>
                    {type.name} ({selectedRoot}{type.symbol})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateChord}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Chord
            </button>
          </div>

          {/* Chord Display */}
          <div className="space-y-4">
            {currentChord && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {currentChord.root}{selectedType.symbol}
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    {currentChord.type}
                  </div>
                  <div className="text-lg text-white mb-4">
                    Notes: {currentChord.notes.join(' - ')}
                  </div>
                  <button
                    onClick={playChord}
                    disabled={isPlaying}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {isPlaying ? (
                      <PauseIcon className="w-4 h-4 mr-2" />
                    ) : (
                      <PlayIcon className="w-4 h-4 mr-2" />
                    )}
                    {isPlaying ? 'Playing...' : 'Play Chord'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Chord Progressions */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Enhanced Chord Progressions with Rhythm Section
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Key
              </label>
              <select
                value={selectedRoot}
                onChange={(e) => setSelectedRoot(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {NOTES.map(note => (
                  <option key={note} value={note}>{note} Major</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Progression
              </label>
              <select
                value={selectedProgression.name}
                onChange={(e) => {
                  const prog = COMMON_PROGRESSIONS.find(p => p.name === e.target.value);
                  if (prog) setSelectedProgression(prog);
                }}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {COMMON_PROGRESSIONS.map(prog => (
                  <option key={prog.name} value={prog.name}>
                    {prog.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">
              {selectedProgression.name} in {selectedRoot}
            </h4>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {transposeProgression(selectedProgression, selectedRoot).map((chord, index) => (
                <div
                  key={index}
                  className="bg-gray-700 rounded-lg p-3 text-center"
                >
                  <div className="text-lg font-bold text-blue-400">
                    {chord}
                  </div>
                  <div className="text-xs text-gray-400">
                    Chord {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Enhanced Controls */}
            <div className="space-y-4 border-t border-gray-600 pt-4">
              {/* BPM Control */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  BPM: {bpm}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="range"
                    min="60"
                    max="180"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                  <input
                    type="number"
                    min="60"
                    max="180"
                    value={bpm}
                    onChange={(e) => setBpm(Number(e.target.value))}
                    className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                  />
                </div>
              </div>

              {/* Track Toggles */}
              <div className="grid grid-cols-3 gap-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeChords}
                    onChange={(e) => setIncludeChords(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Chords</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeDrums}
                    onChange={(e) => setIncludeDrums(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Drums</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={includeBass}
                    onChange={(e) => setIncludeBass(e.target.checked)}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">Bass</span>
                </label>
              </div>

              {/* Pattern Selection */}
              {includeDrums && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Drum Pattern
                  </label>
                  <select
                    value={selectedDrumPattern}
                    onChange={(e) => setSelectedDrumPattern(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(DRUM_PATTERNS).map(pattern => (
                      <option key={pattern} value={pattern}>{pattern}</option>
                    ))}
                  </select>
                </div>
              )}

              {includeBass && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bass Pattern
                  </label>
                  <select
                    value={selectedBassPattern}
                    onChange={(e) => setSelectedBassPattern(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.keys(BASS_PATTERNS).map(pattern => (
                      <option key={pattern} value={pattern}>{pattern}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Play Controls */}
              <div className="flex space-x-2">
                <button
                  onClick={playProgression}
                  disabled={isProgressionPlaying}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProgressionPlaying ? (
                    <PauseIcon className="w-4 h-4 mr-2" />
                  ) : (
                    <PlayIcon className="w-4 h-4 mr-2" />
                  )}
                  {isProgressionPlaying ? 'Playing...' : 'Play Full Mix'}
                </button>
                
                {isProgressionPlaying && (
                  <button
                    onClick={stopProgression}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <StopIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Visualization */}
      {(includeDrums || includeBass) && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Rhythm Pattern Visualization
          </h3>
          
          <div className="space-y-4">
            {/* Beat markers */}
            <div className="grid grid-cols-16 gap-1 mb-4">
              {Array.from({ length: 16 }, (_, i) => (
                <div
                  key={i}
                  className={`text-xs text-center py-1 rounded ${
                    i % 4 === 0 ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {i % 4 === 0 ? Math.floor(i / 4) + 1 : '·'}
                </div>
              ))}
            </div>

            {/* Drum patterns */}
            {includeDrums && (
              <div className="space-y-2">
                <h4 className="text-white font-medium mb-2">{selectedDrumPattern} Drum Pattern</h4>
                
                {/* Kick */}
                <div className="flex items-center space-x-2">
                  <span className="w-12 text-sm text-gray-300">Kick</span>
                  <div className="grid grid-cols-16 gap-1 flex-1">
                    {DRUM_PATTERNS[selectedDrumPattern as keyof typeof DRUM_PATTERNS].kick.map((hit, i) => (
                      <div
                        key={i}
                        className={`h-6 rounded ${
                          hit ? 'bg-red-500' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Snare */}
                <div className="flex items-center space-x-2">
                  <span className="w-12 text-sm text-gray-300">Snare</span>
                  <div className="grid grid-cols-16 gap-1 flex-1">
                    {DRUM_PATTERNS[selectedDrumPattern as keyof typeof DRUM_PATTERNS].snare.map((hit, i) => (
                      <div
                        key={i}
                        className={`h-6 rounded ${
                          hit ? 'bg-yellow-500' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Hi-hat */}
                <div className="flex items-center space-x-2">
                  <span className="w-12 text-sm text-gray-300">Hi-hat</span>
                  <div className="grid grid-cols-16 gap-1 flex-1">
                    {DRUM_PATTERNS[selectedDrumPattern as keyof typeof DRUM_PATTERNS].hihat.map((hit, i) => (
                      <div
                        key={i}
                        className={`h-6 rounded ${
                          hit ? 'bg-cyan-500' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bass pattern */}
            {includeBass && (
              <div className="space-y-2 mt-4">
                <h4 className="text-white font-medium mb-2">{selectedBassPattern} Bass Pattern</h4>
                <div className="flex items-center space-x-2">
                  <span className="w-12 text-sm text-gray-300">Bass</span>
                  <div className="grid grid-cols-16 gap-1 flex-1">
                    {BASS_PATTERNS[selectedBassPattern as keyof typeof BASS_PATTERNS].pattern.map((hit, i) => (
                      <div
                        key={i}
                        className={`h-6 rounded ${
                          hit ? 'bg-purple-500' : 'bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="text-xs text-gray-400 ml-14">
                  Pattern: {BASS_PATTERNS[selectedBassPattern as keyof typeof BASS_PATTERNS].notes} notes
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
