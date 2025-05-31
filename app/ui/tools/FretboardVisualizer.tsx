'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { MusicalNoteIcon } from '@heroicons/react/24/outline';

// Import all the separate components we created
import DisplayModeSelector from './fretboard/DisplayModeSelector';
import RootNoteSelector from './fretboard/RootNoteSelector';
import ScaleChordSelector from './fretboard/ScaleChordSelector';
import TuningSelector from './fretboard/TuningSelector';
import StringCountSelector from './fretboard/StringCountSelector';
import FretCountSelector from './fretboard/FretCountSelector';
import DisplayOptions from './fretboard/DisplayOptions';
import CustomTuningControls from './fretboard/CustomTuningControls';
import ProgressionControls from './fretboard/ProgressionControls';
import CurrentSelectionDisplay from './fretboard/CurrentSelectionDisplay';
import Legend from './fretboard/Legend';

// Import constants, types, and utilities
import { SCALES, CHORDS, CHORD_TYPES, COMMON_PROGRESSIONS, NOTES, TUNINGS } from './fretboard/constants';
import { DisplayMode, ScaleType, ChordType, TuningType, ProgressionType, Chord, SoundType } from './fretboard/types';
import { 
  getNoteAtFret, 
  isNoteInPattern, 
  isRootNote, 
  getIntervalName, 
  generateChord, 
  transposeProgression 
} from './fretboard/utils';

export default function FretboardVisualizer() {
  // Basic state
  const [selectedTuning, setSelectedTuning] = useState<TuningType>('6-String Standard');
  const [customTuning, setCustomTuning] = useState<string[]>(['E', 'A', 'D', 'G', 'B', 'E']);
  const [numStrings, setNumStrings] = useState(6);
  const [selectedRoot, setSelectedRoot] = useState('C');
  const [selectedScale, setSelectedScale] = useState<ScaleType>('Major (Ionian)');
  const [selectedChord, setSelectedChord] = useState<ChordType>('Major');
  const [displayMode, setDisplayMode] = useState<DisplayMode>('scale');
  const [numFrets, setNumFrets] = useState(12);
  const [showNoteNames, setShowNoteNames] = useState(true);
  const [highlightRoot, setHighlightRoot] = useState(true);

  // Chord progression state
  const [selectedProgression, setSelectedProgression] = useState<ProgressionType>(COMMON_PROGRESSIONS[0]!);
  const [currentProgressionChord, setCurrentProgressionChord] = useState<Chord | null>(null);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [isProgressionPlaying, setIsProgressionPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [soundType, setSoundType] = useState<SoundType>('piano');

  // Audio context refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const progressionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chordTimeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const isPlayingRef = useRef(false);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      // Cleanup timeouts and audio context
      isPlayingRef.current = false;
      if (progressionTimeoutRef.current) {
        clearTimeout(progressionTimeoutRef.current);
      }
      chordTimeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Ensure audio context is resumed (required for modern browsers)
  const ensureAudioContextResumed = async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('Audio context resumed successfully');
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  };

  // Get current tuning
  const tuning = selectedTuning === 'Custom' ? customTuning : TUNINGS[selectedTuning];
  
  // Get intervals based on display mode
  const getIntervals = () => {
    if (displayMode === 'scale') {
      return SCALES[selectedScale];
    } else if (displayMode === 'chord') {
      return CHORDS[selectedChord];
    } else if (displayMode === 'progression') {
      // When in progression mode, always show the scale as background
      return SCALES[selectedScale];
    }
    return SCALES[selectedScale];
  };
  
  const intervals = getIntervals();
  
  // Get current root note for progression mode
  const getCurrentRoot = () => {
    if (displayMode === 'progression' && currentProgressionChord) {
      return currentProgressionChord.root;
    }
    return selectedRoot;
  };
  
  const currentRoot = getCurrentRoot();

  // Helper function to check if a note is part of the currently playing chord
  const isNoteInCurrentChord = (note: string): boolean => {
    if (!isProgressionPlaying || !currentProgressionChord) {
      return false;
    }
    return currentProgressionChord.notes.includes(note);
  };

  // Handlers
  const updateTuningAndStrings = (tuning: TuningType) => {
    setSelectedTuning(tuning);
    if (tuning !== 'Custom') {
      const tuningStrings = TUNINGS[tuning];
      setNumStrings(tuningStrings.length);
      setCustomTuning(tuningStrings);
    }
  };

  const updateCustomTuning = (index: number, note: string) => {
    const newTuning = [...customTuning];
    newTuning[index] = note;
    setCustomTuning(newTuning);
  };

  const adjustStringCount = (count: number) => {
    setNumStrings(count);
    if (count > customTuning.length) {
      const newTuning = [...customTuning];
      while (newTuning.length < count) {
        newTuning.push('E');
      }
      setCustomTuning(newTuning);
    } else if (count < customTuning.length) {
      setCustomTuning(customTuning.slice(0, count));
    }
    setSelectedTuning('Custom');
  };

  // Progression playback functions
  const playProgression = async () => {
    if (!audioContextRef.current) return;
    
    // Ensure audio context is resumed before playing
    await ensureAudioContextResumed();
    
    setIsProgressionPlaying(true);
    isPlayingRef.current = true;
    const context = audioContextRef.current;
    
    // Clear any existing timeouts
    chordTimeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    chordTimeoutRefs.current = [];
    if (progressionTimeoutRef.current) {
      clearTimeout(progressionTimeoutRef.current);
    }
    
    const beatDuration = 60 / bpm;
    const chordDuration = beatDuration * 4;
    const transposedChords = transposeProgression(selectedProgression, selectedRoot);
    const progressionDuration = transposedChords.length * chordDuration;
    
    // Function to play one loop of the progression
    const playProgressionLoop = async (startTime: number) => {
      for (const [chordIndex, chord] of transposedChords.entries()) {
        const chordStartTime = startTime + (chordIndex * chordDuration);
        
        // Update the current chord immediately for the first chord
        if (chordIndex === 0) {
          const chordObj = generateChord(
            chord.replace(/[^A-G#]/g, ''), 
            chord.includes('m') && !chord.includes('maj') ? CHORD_TYPES[1]! : CHORD_TYPES[0]!
          );
          setCurrentProgressionChord(chordObj);
          setCurrentChordIndex(chordIndex);
        }
        
        // Set timeout for subsequent chord changes
        if (chordIndex > 0) {
          const chordTimeout = setTimeout(() => {
            const chordObj = generateChord(
              chord.replace(/[^A-G#]/g, ''), 
              chord.includes('m') && !chord.includes('maj') ? CHORD_TYPES[1]! : CHORD_TYPES[0]!
            );
            setCurrentProgressionChord(chordObj);
            setCurrentChordIndex(chordIndex);
          }, (chordIndex * chordDuration * 1000));
          
          chordTimeoutRefs.current.push(chordTimeout);
        }
        
        const chordObj = generateChord(
          chord.replace(/[^A-G#]/g, ''), 
          chord.includes('m') && !chord.includes('maj') ? CHORD_TYPES[1]! : CHORD_TYPES[0]!
        );
        
        if (soundType === 'piano') {
          await playPianoChord(context, chordObj, chordStartTime, chordDuration);
        } else {
          await playDrumsAndBass(context, chordObj, chordStartTime, chordDuration, beatDuration);
        }
      }
    };
    
    // Start the first loop immediately
    const now = context.currentTime;
    await playProgressionLoop(now);
    
    // Set up continuous looping
    const scheduleNextLoop = async (loopStartTime: number) => {
      const nextLoopTime = loopStartTime + progressionDuration;
      const timeoutMs = progressionDuration * 1000; // Convert seconds to milliseconds
      
      console.log(`Scheduling next fretboard loop in ${timeoutMs}ms`);
      console.log(`Current loop started at: ${loopStartTime}, next will start at: ${nextLoopTime}`);
      
      const timeout = setTimeout(async () => {
        if (isPlayingRef.current) {
          console.log('Looping fretboard progression back to start');
          // Reset to first chord for visual feedback
          setCurrentChordIndex(0);
          // Start next loop with the pre-calculated start time
          await playProgressionLoop(nextLoopTime);
          await scheduleNextLoop(nextLoopTime);
        }
      }, timeoutMs);
      
      progressionTimeoutRef.current = timeout;
    };
    
    // Schedule the next loop
    await scheduleNextLoop(now);
  };

  // Piano sound generation
  const playPianoChord = async (context: AudioContext, chordObj: Chord, startTime: number, duration: number) => {
    // Ensure audio context is resumed before playing
    await ensureAudioContextResumed();
    
    const noteFrequencies: Record<string, number> = {
      'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
      'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88
    };

    chordObj.notes.forEach((note, noteIndex) => {
      // Create multiple oscillators for richer sound
      for (let i = 0; i < 2; i++) {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        const frequency = noteFrequencies[note];
        if (frequency) {
          // Add slight detuning for richness
          const detune = i === 0 ? 0 : 5;
          oscillator.frequency.setValueAtTime(frequency, startTime);
          oscillator.detune.setValueAtTime(detune, startTime);
          oscillator.type = i === 0 ? 'sine' : 'triangle';
          
          // Improved gain envelope
          const volume = i === 0 ? 0.2 : 0.1;
          gainNode.gain.setValueAtTime(0, startTime);
          gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05);
          gainNode.gain.linearRampToValueAtTime(volume * 0.7, startTime + 0.5);
          gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
          
          oscillator.start(startTime);
          oscillator.stop(startTime + duration);
        }
      }
    });
  };

  // Drums and bass generation
  const playDrumsAndBass = async (context: AudioContext, chordObj: Chord, startTime: number, chordDuration: number, beatDuration: number) => {
    // Ensure audio context is resumed before playing
    await ensureAudioContextResumed();
    
    const noteFrequencies: Record<string, number> = {
      'C': 65.41, 'C#': 69.30, 'D': 73.42, 'D#': 77.78,
      'E': 82.41, 'F': 87.31, 'F#': 92.50, 'G': 98.00,
      'G#': 103.83, 'A': 110.00, 'A#': 116.54, 'B': 123.47
    };

    // Bass line (root note of chord)
    const bassFreq = noteFrequencies[chordObj.root];
    if (bassFreq) {
      for (let beat = 0; beat < 4; beat++) {
        const beatTime = startTime + (beat * beatDuration);
        
        const bassOsc = context.createOscillator();
        const bassGain = context.createGain();
        
        bassOsc.connect(bassGain);
        bassGain.connect(context.destination);
        
        bassOsc.frequency.setValueAtTime(bassFreq, beatTime);
        bassOsc.type = 'sawtooth';
        
        bassGain.gain.setValueAtTime(0, beatTime);
        bassGain.gain.linearRampToValueAtTime(0.15, beatTime + 0.01);
        bassGain.gain.exponentialRampToValueAtTime(0.001, beatTime + beatDuration * 0.8);
        
        bassOsc.start(beatTime);
        bassOsc.stop(beatTime + beatDuration * 0.8);
      }
    }

    // Drum pattern
    for (let beat = 0; beat < 4; beat++) {
      const beatTime = startTime + (beat * beatDuration);
      
      // Kick drum (beats 1 and 3)
      if (beat === 0 || beat === 2) {
        const kickOsc = context.createOscillator();
        const kickGain = context.createGain();
        
        kickOsc.connect(kickGain);
        kickGain.connect(context.destination);
        
        kickOsc.frequency.setValueAtTime(60, beatTime);
        kickOsc.frequency.exponentialRampToValueAtTime(40, beatTime + 0.1);
        kickOsc.type = 'sine';
        
        kickGain.gain.setValueAtTime(0, beatTime);
        kickGain.gain.linearRampToValueAtTime(0.2, beatTime + 0.01);
        kickGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.2);
        
        kickOsc.start(beatTime);
        kickOsc.stop(beatTime + 0.2);
      }
      
      // Snare drum (beats 2 and 4)
      if (beat === 1 || beat === 3) {
        // White noise for snare
        const bufferSize = context.sampleRate * 0.1;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const output = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
          output[i] = Math.random() * 2 - 1;
        }
        
        const snareSource = context.createBufferSource();
        const snareGain = context.createGain();
        const snareFilter = context.createBiquadFilter();
        
        snareSource.buffer = buffer;
        snareSource.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(context.destination);
        
        snareFilter.type = 'highpass';
        snareFilter.frequency.setValueAtTime(1000, beatTime);
        
        snareGain.gain.setValueAtTime(0, beatTime);
        snareGain.gain.linearRampToValueAtTime(0.1, beatTime + 0.01);
        snareGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.15);
        
        snareSource.start(beatTime);
        snareSource.stop(beatTime + 0.15);
      }
      
      // Hi-hat (every beat)
      const hihatBufferSize = context.sampleRate * 0.05;
      const hihatBuffer = context.createBuffer(1, hihatBufferSize, context.sampleRate);
      const hihatOutput = hihatBuffer.getChannelData(0);
      
      for (let i = 0; i < hihatBufferSize; i++) {
        hihatOutput[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / hihatBufferSize, 2);
      }
      
      const hihatSource = context.createBufferSource();
      const hihatGain = context.createGain();
      const hihatFilter = context.createBiquadFilter();
      
      hihatSource.buffer = hihatBuffer;
      hihatSource.connect(hihatFilter);
      hihatFilter.connect(hihatGain);
      hihatGain.connect(context.destination);
      
      hihatFilter.type = 'highpass';
      hihatFilter.frequency.setValueAtTime(8000, beatTime);
      
      hihatGain.gain.setValueAtTime(0, beatTime);
      hihatGain.gain.linearRampToValueAtTime(0.05, beatTime + 0.01);
      hihatGain.gain.exponentialRampToValueAtTime(0.001, beatTime + 0.05);
      
      hihatSource.start(beatTime);
      hihatSource.stop(beatTime + 0.05);
    }
  };

  const stopProgression = () => {
    setIsProgressionPlaying(false);
    isPlayingRef.current = false;
    setCurrentProgressionChord(null);
    setCurrentChordIndex(0);
    
    if (progressionTimeoutRef.current) {
      clearTimeout(progressionTimeoutRef.current);
    }
    
    chordTimeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    chordTimeoutRefs.current = [];
  };

  const handleProgressionChange = (progression: ProgressionType) => {
    setSelectedProgression(progression);
    stopProgression();
  };

  // Fretboard rendering
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
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      isNoteInCurrentChord(stringNote)
                        ? 'bg-green-500 text-white ring-4 ring-green-300 animate-pulse shadow-lg shadow-green-500/50 scale-110 border-2 border-green-200'
                        : isRootNote(stringNote, currentRoot) && highlightRoot
                        ? (displayMode === 'progression' && isProgressionPlaying 
                           ? 'bg-red-800 text-gray-300' 
                           : 'bg-red-500 text-white')
                        : (displayMode === 'progression' && isProgressionPlaying 
                           ? 'bg-blue-800 text-gray-400' 
                           : 'bg-blue-500 text-white')
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
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold z-10 transition-all duration-300 ${
                          isNoteInCurrentChord(note)
                            ? 'bg-green-500 text-white ring-4 ring-green-300 animate-pulse shadow-lg shadow-green-500/50 scale-110 border-2 border-green-200'
                            : isRoot && highlightRoot
                            ? (displayMode === 'progression' && isProgressionPlaying 
                               ? 'bg-red-800 text-gray-300 ring-2 ring-red-900' 
                               : 'bg-red-500 text-white ring-2 ring-red-300')
                            : (displayMode === 'progression' && isProgressionPlaying 
                               ? 'bg-blue-800 text-gray-400' 
                               : 'bg-blue-500 text-white')
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
          <DisplayModeSelector 
            displayMode={displayMode} 
            onDisplayModeChange={setDisplayMode} 
          />
          
          <RootNoteSelector 
            selectedRoot={selectedRoot} 
            onRootChange={setSelectedRoot} 
          />
          
          <ScaleChordSelector
            displayMode={displayMode}
            selectedScale={selectedScale}
            selectedChord={selectedChord}
            selectedProgression={selectedProgression}
            onScaleChange={setSelectedScale}
            onChordChange={setSelectedChord}
            onProgressionChange={handleProgressionChange}
          />
          
          <TuningSelector 
            selectedTuning={selectedTuning} 
            onTuningChange={updateTuningAndStrings} 
          />
          
          <StringCountSelector 
            numStrings={numStrings} 
            onStringCountChange={adjustStringCount} 
          />
          
          <FretCountSelector 
            numFrets={numFrets} 
            onFretCountChange={setNumFrets} 
          />
          
          <DisplayOptions
            showNoteNames={showNoteNames}
            highlightRoot={highlightRoot}
            onShowNoteNamesChange={setShowNoteNames}
            onHighlightRootChange={setHighlightRoot}
          />
        </div>

        {/* Chord Progression Controls - Only show when in progression mode */}
        {displayMode === 'progression' && (
          <ProgressionControls
            selectedProgression={selectedProgression}
            selectedRoot={selectedRoot}
            isProgressionPlaying={isProgressionPlaying}
            currentChordIndex={currentChordIndex}
            currentProgressionChord={currentProgressionChord}
            bpm={bpm}
            soundType={soundType}
            onPlayProgression={playProgression}
            onStopProgression={stopProgression}
            onBpmChange={setBpm}
            onSoundTypeChange={setSoundType}
          />
        )}

        {/* Custom Tuning Controls */}
        {selectedTuning === 'Custom' && (
          <CustomTuningControls
            customTuning={customTuning}
            onCustomTuningChange={updateCustomTuning}
          />
        )}

        {/* Current Selection Display */}
        <CurrentSelectionDisplay
          displayMode={displayMode}
          selectedRoot={selectedRoot}
          selectedScale={selectedScale}
          selectedChord={selectedChord}
          selectedProgression={selectedProgression}
          selectedTuning={selectedTuning}
          customTuning={customTuning}
          numStrings={numStrings}
          intervals={intervals}
          currentProgressionChord={currentProgressionChord}
        />

        {/* Legend */}
        <Legend 
          displayMode={displayMode} 
          isProgressionPlaying={isProgressionPlaying}
        />

        {/* Fretboard */}
        {renderFretboard()}
      </div>
    </div>
  );
}