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
    <div className="rounded-md bg-gray-800 p-4 md:p-6">
      <div className="mb-4">
        <label htmlFor="title" className="mb-2 block text-sm font-medium text-white">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter the title of your recording"
          className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="description" className="mb-2 block text-sm font-medium text-white">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your recording details"
          className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
        />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="genre" className="mb-2 block text-sm font-medium text-white">
            Genre
          </label>
          <input
            id="genre"
            name="genre"
            type="text"
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
            placeholder="e.g., Rock, Jazz, Electronic"
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label htmlFor="tempo" className="mb-2 block text-sm font-medium text-white">
            Tempo (BPM)
          </label>
          <input
            id="tempo"
            name="tempo"
            type="number"
            value={tempo}
            onChange={(e) => onTempoChange(parseInt(e.target.value, 10) || 0)}
            placeholder="e.g., 120"
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
          />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-2 gap-4">

        <div>
          <label htmlFor="key" className="mb-2 block text-sm font-medium text-white">
            Scale
          </label>
          <select
            id="key"
            name="key"
            value={keySignature}
            onChange={(e) => onKeySignatureChange(e.target.value)}  // Changed from onKeyChange
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white"
          >
            <option value="">Select Root</option>
            <option value="C">C</option>
            <option value="C#">C#</option>
            <option value="D">D</option>
            <option value="D#">D#</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="F#">F#</option>
            <option value="G">G</option>
            <option value="G#">G#</option>
            <option value="A">A</option>
            <option value="A#">A#</option>
            <option value="B">B</option>
          </select>
        </div>
      <div className="mb-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="scale" className="mb-2 block text-sm font-medium text-white">
            Mode
          </label>
          <select
            id="scale"
            name="scale"
            value={scale}
            onChange={(e) => onScaleChange(e.target.value)}
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white"
          >
            <option value="">Select Scale</option>
            <option value="Major">Major</option>
            <option value="Minor">Minor</option>
            <option value="Dorian">Dorian</option>
            <option value="Phrygian">Phrygian</option>
            <option value="Lydian">Lydian</option>
            <option value="Mixolydian">Mixolydian</option>
            <option value="Aeolian">Aeolian</option>
            <option value="Locrian">Locrian</option>
          </select>
        </div>
        </div>
        </div>
        <div className="mb-4">
        <label htmlFor="chords" className="mb-2 block text-sm font-medium text-white">
          Chord Progression
        </label>
        <select
          id="chords"
          name="chords"
          value={chords}
          onChange={(e) => onChordsChange(e.target.value)}
          className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white"
        >
          <option value="">Select Progression</option>
          <option value="I-IV-V">I-IV-V</option>
          <option value="ii-V-I">ii-V-I</option>
          <option value="I-V-vi-IV">I-V-vi-IV</option>
          <option value="I-vi-IV-V">I-vi-IV-V</option>
          <option value="I-IV-vi-V">I-IV-vi-V</option>
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="instrument" className="mb-2 block text-sm font-medium text-white">
          Instrument
        </label>
        <select
          id="instrument"
          name="instrument"
          value={instrument}
          onChange={(e) => onInstrumentChange(e.target.value)}
          className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white"
        >
          <option value="">Select Instrument</option>
          <option value="Guitar">Guitar</option>
          <option value="Piano">Piano</option>
          <option value="Drums">Drums</option>
          <option value="Bass">Bass</option>
          <option value="Violin">Violin</option>
          <option value="Saxophone">Saxophone</option>
          <option value="Trumpet">Trumpet</option>
          <option value="Flute">Flute</option>
          <option value="Synthesizer">Synthesizer</option>
        </select>
      </div>
    </div>
  );
}