'use client';

import { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/outline';

const TIME_SIGNATURES = [
  { name: '4/4', beatsPerMeasure: 4, noteValue: 4 },
  { name: '3/4', beatsPerMeasure: 3, noteValue: 4 },
  { name: '2/4', beatsPerMeasure: 2, noteValue: 4 },
  { name: '6/8', beatsPerMeasure: 6, noteValue: 8 },
  { name: '9/8', beatsPerMeasure: 9, noteValue: 8 },
  { name: '12/8', beatsPerMeasure: 12, noteValue: 8 },
];

const TEMPO_MARKINGS = [
  { name: 'Largo', min: 40, max: 60 },
  { name: 'Adagio', min: 66, max: 76 },
  { name: 'Andante', min: 76, max: 108 },
  { name: 'Moderato', min: 108, max: 120 },
  { name: 'Allegro', min: 120, max: 168 },
  { name: 'Presto', min: 168, max: 200 },
];

export default function Metronome() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [bpm, setBpm] = useState(120);
  const [timeSignature, setTimeSignature] = useState(TIME_SIGNATURES[0]);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [accent, setAccent] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const tapTimesRef = useRef<number[]>([]);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // Create click sound
  const playClick = (isAccent: boolean = false) => {
    if (!audioContextRef.current || isMuted) return;

    const context = audioContextRef.current;
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Accent beat (downbeat) has higher pitch
    oscillator.frequency.value = isAccent ? 1000 : 800;
    oscillator.type = 'square';

    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume * (isAccent ? 1 : 0.6), context.currentTime + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.1);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  };

  // Start/stop metronome
  const toggleMetronome = () => {
    if (isPlaying) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      const interval = 60000 / bpm; // Convert BPM to milliseconds
      
      intervalRef.current = setInterval(() => {
        setCurrentBeat(prev => {
          const nextBeat = (prev % timeSignature.beatsPerMeasure) + 1;
          const isAccentBeat = nextBeat === 1 && accent;
          playClick(isAccentBeat);
          return nextBeat;
        });
      }, interval);
      
      setIsPlaying(true);
      setCurrentBeat(1);
      playClick(accent); // Play first beat immediately
    }
  };

  // Update interval when BPM changes
  useEffect(() => {
    if (isPlaying && intervalRef.current) {
      clearInterval(intervalRef.current);
      const interval = 60000 / bpm;
      
      intervalRef.current = setInterval(() => {
        setCurrentBeat(prev => {
          const nextBeat = (prev % timeSignature.beatsPerMeasure) + 1;
          const isAccentBeat = nextBeat === 1 && accent;
          playClick(isAccentBeat);
          return nextBeat;
        });
      }, interval);
    }
  }, [bpm, timeSignature, accent, volume, isMuted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getCurrentTempoMarking = () => {
    return TEMPO_MARKINGS.find(marking => bpm >= marking.min && bpm <= marking.max)?.name || 'Custom';
  };

  const tapTempo = () => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    
    // Keep only the last 8 taps for better accuracy
    if (tapTimesRef.current.length > 8) {
      tapTimesRef.current = tapTimesRef.current.slice(-8);
    }
    
    // Need at least 2 taps to calculate tempo
    if (tapTimesRef.current.length >= 2) {
      const intervals = [];
      for (let i = 1; i < tapTimesRef.current.length; i++) {
        intervals.push(tapTimesRef.current[i] - tapTimesRef.current[i - 1]);
      }
      
      // Calculate average interval in milliseconds
      const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
      
      // Convert to BPM (60000ms = 1 minute)
      const calculatedBpm = Math.round(60000 / avgInterval);
      
      // Clamp to valid range
      const newBpm = Math.max(40, Math.min(200, calculatedBpm));
      setBpm(newBpm);
    }
    
    // Reset tap times after 3 seconds of inactivity
    setTimeout(() => {
      if (tapTimesRef.current.length > 0 && Date.now() - tapTimesRef.current[tapTimesRef.current.length - 1] >= 3000) {
        tapTimesRef.current = [];
      }
    }, 3000);
  };

  return (
    <div className="space-y-8">
      {/* Main Metronome Display */}
      <div className="text-center space-y-6">
        {/* BPM Display */}
        <div className="bg-gray-900 rounded-xl p-8 space-y-4">
          <div className="text-6xl font-bold text-white">
            {bpm}
          </div>
          <div className="text-lg text-gray-400">
            BPM ({getCurrentTempoMarking()})
          </div>
          
          {/* Visual Beat Indicator */}
          <div className="flex justify-center space-x-2 mt-6">
            {Array.from({ length: timeSignature.beatsPerMeasure }).map((_, index) => (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-100 ${
                  currentBeat === index + 1
                    ? index === 0 && accent
                      ? 'bg-red-500 scale-125'
                      : 'bg-blue-500 scale-125'
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Play/Pause Button */}
        <button
          onClick={toggleMetronome}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-2xl transition-all duration-200 ${
            isPlaying 
              ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/25' 
              : 'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-500/25'
          }`}
        >
          {isPlaying ? (
            <PauseIcon className="w-8 h-8" />
          ) : (
            <PlayIcon className="w-8 h-8 ml-1" />
          )}
        </button>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tempo Controls */}
        <div className="bg-gray-900 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Tempo</h3>
          
          <div className="space-y-4">
            {/* BPM Slider */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Beats Per Minute
              </label>
              <input
                type="range"
                min="40"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>40</span>
                <span>200</span>
              </div>
            </div>

            {/* BPM Input */}
            <div className="flex space-x-2">
              <button
                onClick={() => setBpm(Math.max(40, bpm - 5))}
                className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                -5
              </button>
              <input
                type="number"
                min="40"
                max="200"
                value={bpm}
                onChange={(e) => setBpm(Math.max(40, Math.min(200, parseInt(e.target.value) || 120)))}
                className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => setBpm(Math.min(200, bpm + 5))}
                className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                +5
              </button>
            </div>

            {/* Tap Tempo */}
            <button
              onClick={tapTempo}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Tap Tempo
            </button>
          </div>
        </div>

        {/* Time Signature & Settings */}
        <div className="bg-gray-900 rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white mb-4">Settings</h3>
          
          <div className="space-y-4">
            {/* Time Signature */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time Signature
              </label>
              <select
                value={timeSignature.name}
                onChange={(e) => {
                  const sig = TIME_SIGNATURES.find(s => s.name === e.target.value);
                  if (sig) {
                    setTimeSignature(sig);
                    setCurrentBeat(0);
                  }
                }}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIME_SIGNATURES.map(sig => (
                  <option key={sig.name} value={sig.name}>
                    {sig.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Volume Control */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Volume
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {isMuted ? (
                    <SpeakerXMarkIcon className="w-5 h-5" />
                  ) : (
                    <SpeakerWaveIcon className="w-5 h-5" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    const newVolume = parseFloat(e.target.value);
                    setVolume(newVolume);
                    setIsMuted(newVolume === 0);
                  }}
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            {/* Accent Toggle */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                Accent First Beat
              </label>
              <button
                onClick={() => setAccent(!accent)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  accent ? 'bg-blue-600' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    accent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Tempos */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Common Tempos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {[60, 80, 100, 120, 140, 160].map(tempo => (
            <button
              key={tempo}
              onClick={() => setBpm(tempo)}
              className={`py-2 px-4 rounded-lg transition-colors ${
                bpm === tempo
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tempo}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
