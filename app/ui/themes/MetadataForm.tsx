import React from 'react';

interface MetadataFormProps {
  title: string;
  onTitleChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  genre: string;
  onGenreChange: (value: string) => void;
  keySignature: string;
  onKeySignatureChange: (value: string) => void;
  tempo: number;
  onTempoChange: (value: number) => void;
  scale: string;
  onScaleChange: (value: string) => void;
  chords: string;
  onChordsChange: (value: string) => void;
  instrument: string;
  onInstrumentChange: (value: string) => void;
  mode: string;
  onModeChange: (value: string) => void;
}

const popularGenres = ['Rock', 'Pop', 'Jazz', 'Blues', 'Classical', 'Electronic', 'Hip Hop', 'Country', 'R&B', 'Folk'];
const keySignatures = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const instruments = ['Piano', 'Guitar', 'Bass', 'Drums', 'Violin', 'Saxophone', 'Vocals', 'Synthesizer', 'Trumpet', 'Flute'];
const modes = ['Major', 'Minor', 'Dorian', 'Mixolydian', 'Lydian', 'Phrygian', 'Locrian'];

export default function MetadataForm({
  title,
  onTitleChange,
  description,
  onDescriptionChange,
  genre,
  onGenreChange,
  keySignature,
  onKeySignatureChange,
  tempo,
  onTempoChange,
  scale,
  onScaleChange,
  chords,
  onChordsChange,
  instrument,
  onInstrumentChange,
  mode,
  onModeChange,
}: MetadataFormProps) {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">1</span>
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-1">
              Theme Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Enter your theme title..."
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 px-3 py-2"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe your theme (optional)..."
              rows={3}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 px-3 py-2 resize-none"
            />
          </div>
        </div>
      </div>

      {/* Musical Details */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <span className="bg-purple-500 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">2</span>
          Musical Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-1">
              Genre
            </label>
            <select
              id="genre"
              value={genre}
              onChange={(e) => onGenreChange(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white focus:border-purple-500 focus:ring-purple-500 px-3 py-2"
            >
              <option value="">Select a genre...</option>
              {popularGenres.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="instrument" className="block text-sm font-medium text-gray-300 mb-1">
              Primary Instrument
            </label>
            <select
              id="instrument"
              value={instrument}
              onChange={(e) => onInstrumentChange(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white focus:border-purple-500 focus:ring-purple-500 px-3 py-2"
            >
              <option value="">Select an instrument...</option>
              {instruments.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Music Theory (Optional) */}
      <details className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-6 shadow-lg">
        <summary className="text-lg font-semibold text-white mb-4 flex items-center cursor-pointer hover:text-gray-300">
          <span className="bg-green-500 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">3</span>
          Music Theory (Optional)
          <span className="ml-auto text-sm text-gray-400">Click to expand</span>
        </summary>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label htmlFor="keySignature" className="block text-sm font-medium text-gray-300 mb-1">
              Key
            </label>
            <select
              id="keySignature"
              value={keySignature}
              onChange={(e) => onKeySignatureChange(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white focus:border-green-500 focus:ring-green-500 px-3 py-2"
            >
              <option value="">Select key...</option>
              {keySignatures.map((key) => (
                <option key={key} value={key}>{key}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="mode" className="block text-sm font-medium text-gray-300 mb-1">
              Mode
            </label>
            <select
              id="mode"
              value={mode}
              onChange={(e) => onModeChange(e.target.value)}
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white focus:border-green-500 focus:ring-green-500 px-3 py-2"
            >
              <option value="">Select mode...</option>
              {modes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="tempo" className="block text-sm font-medium text-gray-300 mb-1">
              Tempo (BPM)
            </label>
            <input
              id="tempo"
              type="number"
              value={tempo}
              onChange={(e) => onTempoChange(parseInt(e.target.value) || 120)}
              min="60"
              max="200"
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white focus:border-green-500 focus:ring-green-500 px-3 py-2"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="chords" className="block text-sm font-medium text-gray-300 mb-1">
              Chord Progression
            </label>
            <input
              id="chords"
              type="text"
              value={chords}
              onChange={(e) => onChordsChange(e.target.value)}
              placeholder="e.g., C - Am - F - G"
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500 px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="scale" className="block text-sm font-medium text-gray-300 mb-1">
              Scale
            </label>
            <input
              id="scale"
              type="text"
              value={scale}
              onChange={(e) => onScaleChange(e.target.value)}
              placeholder="e.g., Pentatonic"
              className="w-full rounded-lg border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-green-500 focus:ring-green-500 px-3 py-2"
            />
          </div>
        </div>
      </details>
    </div>
  );
}