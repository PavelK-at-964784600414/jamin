'use client';

import { useState } from 'react';
import { MusicalNoteIcon, AcademicCapIcon, BookOpenIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';

interface Instrument {
  id: string;
  name: string;
  category: string;
  tuning?: string[];
  ranges?: string[];
  techniques?: string[];
  scales?: string[];
  tips?: string[];
}

const INSTRUMENTS: Instrument[] = [
  {
    id: 'guitar',
    name: 'Guitar',
    category: 'String',
    tuning: ['E', 'A', 'D', 'G', 'B', 'E'],
    ranges: ['Low E (82.4 Hz)', 'High E (329.6 Hz)'],
    techniques: [
      'Fingerpicking',
      'Strumming patterns',
      'Barre chords',
      'Hammer-ons',
      'Pull-offs',
      'Bending',
      'Slide playing',
      'Palm muting',
    ],
    scales: [
      'Pentatonic Minor',
      'Pentatonic Major',
      'Blues Scale',
      'Natural Minor',
      'Major Scale',
      'Dorian Mode',
      'Mixolydian Mode',
    ],
    tips: [
      'Start with basic open chords (G, C, D, Em, Am)',
      'Practice chord transitions slowly before speeding up',
      'Keep your fretting hand relaxed and curved',
      'Use a metronome to develop steady rhythm',
      'Learn songs you enjoy to stay motivated',
    ],
  },
  {
    id: 'piano',
    name: 'Piano',
    category: 'Keyboard',
    ranges: ['A0 (27.5 Hz)', 'C8 (4186 Hz)'],
    techniques: [
      'Proper finger positioning',
      'Scales and arpeggios',
      'Chord inversions',
      'Pedal techniques',
      'Two-hand coordination',
      'Dynamic control',
      'Articulation (staccato, legato)',
    ],
    scales: [
      'C Major (all white keys)',
      'G Major (1 sharp)',
      'D Major (2 sharps)',
      'A Major (3 sharps)',
      'E Major (4 sharps)',
      'Natural Minor scales',
      'Harmonic Minor scales',
      'Chromatic scale',
    ],
    tips: [
      'Maintain proper posture and hand position',
      'Practice scales daily to build finger strength',
      'Start with simple pieces and gradually increase difficulty',
      'Use both hands equally - don\'t neglect the left hand',
      'Listen to recordings of pieces you\'re learning',
    ],
  },
  {
    id: 'bass',
    name: 'Bass Guitar',
    category: 'String',
    tuning: ['E', 'A', 'D', 'G'],
    ranges: ['Low E (41.2 Hz)', 'High G (196 Hz)'],
    techniques: [
      'Fingerstyle playing',
      'Pick playing',
      'Slap and pop',
      'Walking basslines',
      'Groove patterns',
      'String muting',
      'Fret hand muting',
    ],
    scales: [
      'Major Scale',
      'Minor Pentatonic',
      'Blues Scale',
      'Mixolydian Mode',
      'Dorian Mode',
      'Chromatic runs',
    ],
    tips: [
      'Focus on rhythm and timing - you\'re the backbone',
      'Practice with a metronome religiously',
      'Listen to the kick drum and lock in with it',
      'Learn root note patterns for different keys',
      'Study different genres to expand your vocabulary',
    ],
  },
  {
    id: 'drums',
    name: 'Drums',
    category: 'Percussion',
    techniques: [
      'Basic stick grip',
      'Paradiddles',
      'Single stroke roll',
      'Double stroke roll',
      'Flams',
      'Ghost notes',
      'Linear playing',
      'Limb independence',
    ],
    tips: [
      'Start with basic rock beats (kick, snare, hi-hat)',
      'Practice rudiments daily for hand development',
      'Use a metronome to develop internal timing',
      'Learn to play softly before playing loudly',
      'Focus on groove over complexity',
      'Record yourself playing to hear timing issues',
    ],
  },
  {
    id: 'violin',
    name: 'Violin',
    category: 'String',
    tuning: ['G', 'D', 'A', 'E'],
    ranges: ['G3 (196 Hz)', 'E7 (2637 Hz)'],
    techniques: [
      'Proper bow hold',
      'Bow control and distribution',
      'Vibrato',
      'Shifting positions',
      'Double stops',
      'Pizzicato',
      'Spiccato',
      'Legato bowing',
    ],
    scales: [
      'Major scales (1, 2, 3 octaves)',
      'Minor scales',
      'Chromatic scale',
      'Arpeggios',
      'Modes',
    ],
    tips: [
      'Proper posture is crucial for good technique',
      'Practice slow, long bow strokes for tone development',
      'Use a mirror to check your bow angle and posture',
      'Tune frequently - intonation is everything',
      'Start with simple melodies before complex pieces',
    ],
  },
  {
    id: 'trumpet',
    name: 'Trumpet',
    category: 'Brass',
    ranges: ['F#3 (185 Hz)', 'D6 (1175 Hz)'],
    techniques: [
      'Proper embouchure',
      'Breath control',
      'Valve technique',
      'Articulation (tonguing)',
      'Lip flexibility',
      'Range development',
      'Muted playing',
    ],
    tips: [
      'Develop a consistent embouchure from day one',
      'Practice breathing exercises daily',
      'Start with middle register, then expand range',
      'Keep practice sessions short but frequent',
      'Always warm up and cool down properly',
    ],
  },
];

const CATEGORIES = ['All', 'String', 'Keyboard', 'Percussion', 'Brass', 'Woodwind'];

export default function InstrumentAssistant() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'techniques' | 'scales' | 'tips'>('overview');

  const filteredInstruments = selectedCategory === 'All' 
    ? INSTRUMENTS 
    : INSTRUMENTS.filter(instrument => instrument.category === selectedCategory);

  const renderInstrumentDetails = () => {
    if (!selectedInstrument) return null;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-white mb-2">Category</h4>
              <p className="text-gray-300">{selectedInstrument.category} Instrument</p>
            </div>
            
            {selectedInstrument.tuning && (
              <div>
                <h4 className="font-semibold text-white mb-2">Standard Tuning</h4>
                <div className="flex space-x-2">
                  {selectedInstrument.tuning.map((note, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-600 text-white rounded-lg text-sm">
                      {note}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {selectedInstrument.ranges && (
              <div>
                <h4 className="font-semibold text-white mb-2">Range</h4>
                <div className="space-y-1">
                  {selectedInstrument.ranges.map((range, index) => (
                    <p key={index} className="text-gray-300 text-sm">{range}</p>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'techniques':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Essential Techniques</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedInstrument.techniques?.map((technique, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-200 text-sm">{technique}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'scales':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Important Scales</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {selectedInstrument.scales?.map((scale, index) => (
                <div key={index} className="bg-gray-700 p-3 rounded-lg">
                  <p className="text-gray-200 text-sm">{scale}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tips':
        return (
          <div className="space-y-4">
            <h4 className="font-semibold text-white">Practice Tips</h4>
            <div className="space-y-3">
              {selectedInstrument.tips?.map((tip, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="text-gray-200 text-sm">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {!selectedInstrument ? (
        <div className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Instrument Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredInstruments.map((instrument) => (
              <div
                key={instrument.id}
                onClick={() => setSelectedInstrument(instrument)}
                className="group bg-gray-700 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:bg-gray-600 hover:scale-105 border border-gray-600 hover:border-blue-500"
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                    <MusicalNoteIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white group-hover:text-blue-300">
                      {instrument.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{instrument.category}</p>
                  </div>
                </div>
                
                {instrument.tuning && (
                  <div className="mb-3">
                    <p className="text-gray-400 text-xs mb-1">Tuning:</p>
                    <div className="flex space-x-1">
                      {instrument.tuning.slice(0, 4).map((note, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-600 text-white rounded text-xs">
                          {note}
                        </span>
                      ))}
                      {instrument.tuning.length > 4 && (
                        <span className="px-2 py-1 bg-gray-600 text-white rounded text-xs">
                          +{instrument.tuning.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="text-blue-400 text-sm font-medium group-hover:text-blue-300">
                  Learn more →
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Back Button and Title */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <MusicalNoteIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{selectedInstrument.name}</h2>
                <p className="text-gray-400">{selectedInstrument.category} Instrument</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedInstrument(null)}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
            >
              ← Back to Instruments
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
            {[
              { id: 'overview', label: 'Overview', icon: BookOpenIcon },
              { id: 'techniques', label: 'Techniques', icon: SpeakerWaveIcon },
              { id: 'scales', label: 'Scales', icon: MusicalNoteIcon },
              { id: 'tips', label: 'Tips', icon: AcademicCapIcon },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:text-white hover:bg-gray-600'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="bg-gray-700 rounded-lg p-6">
            {renderInstrumentDetails()}
          </div>
        </div>
      )}
    </div>
  );
}
