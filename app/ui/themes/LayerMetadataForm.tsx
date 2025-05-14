import React from 'react';

interface LayerMetadataFormProps {
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

export default function LayerMetadataForm({
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
}: LayerMetadataFormProps) {
  return (
    <div className="rounded-md bg-gray-800 p-4 md:p-6">
      <div className="mb-4">
        <label htmlFor="layer-title" className="mb-2 block text-sm font-medium text-white">
          Layer Title
        </label>
        <input
          id="layer-title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter the title of your layer"
          className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
          required
        />
      </div>
      <div className="mb-4">
        <label htmlFor="layer-description" className="mb-2 block text-sm font-medium text-white">
          Description
        </label>
        <textarea
          id="layer-description"
          name="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Describe your layer (e.g., what instrument you played, style, etc.)"
          className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400 min-h-[100px]"
        />
      </div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="layer-instrument" className="mb-2 block text-sm font-medium text-white">
            Instrument
          </label>
          <input
            id="layer-instrument"
            name="instrument"
            type="text"
            value={instrument}
            onChange={(e) => onInstrumentChange(e.target.value)}
            placeholder="e.g., Guitar, Piano, Vocals"
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label htmlFor="layer-genre" className="mb-2 block text-sm font-medium text-white">
            Genre
          </label>
          <input
            id="layer-genre"
            name="genre"
            type="text"
            value={genre}
            onChange={(e) => onGenreChange(e.target.value)}
            placeholder="e.g., Rock, Jazz, Electronic"
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
          />
        </div>
      </div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="layer-key" className="mb-2 block text-sm font-medium text-white">
            Key
          </label>
          <select
            id="layer-key"
            name="keySignature"
            value={keySignature}
            onChange={(e) => onKeySignatureChange(e.target.value)}
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white"
          >
            <option value="">Select key</option>
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
        <div>
          <label htmlFor="layer-mode" className="mb-2 block text-sm font-medium text-white">
            Mode
          </label>
          <select
            id="layer-mode"
            name="mode"
            value={mode}
            onChange={(e) => onModeChange(e.target.value)}
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white"
          >
            <option value="">Select mode</option>
            <option value="major">Major</option>
            <option value="minor">Minor</option>
            <option value="dorian">Dorian</option>
            <option value="phrygian">Phrygian</option>
            <option value="lydian">Lydian</option>
            <option value="mixolydian">Mixolydian</option>
            <option value="locrian">Locrian</option>
          </select>
        </div>
      </div>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="layer-tempo" className="mb-2 block text-sm font-medium text-white">
            Tempo (BPM)
          </label>
          <input
            id="layer-tempo"
            name="tempo"
            type="number"
            value={tempo}
            onChange={(e) => onTempoChange(parseInt(e.target.value, 10) || 0)}
            placeholder="e.g., 120"
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
          />
        </div>
        <div>
          <label htmlFor="layer-scale" className="mb-2 block text-sm font-medium text-white">
            Scale
          </label>
          <input
            id="layer-scale"
            name="scale"
            type="text"
            value={scale}
            onChange={(e) => onScaleChange(e.target.value)}
            placeholder="e.g., Pentatonic, Blues"
            className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400"
          />
        </div>
      </div>
      <div className="mb-4">
        <label htmlFor="layer-chords" className="mb-2 block text-sm font-medium text-white">
          Chords / Notes (Optional)
        </label>
        <textarea
          id="layer-chords"
          name="chords"
          value={chords}
          onChange={(e) => onChordsChange(e.target.value)}
          placeholder="e.g., Am - G - F - E or any notes you used"
          className="peer block w-full rounded-md border border-gray-600 bg-gray-700 py-2 pl-3 text-sm text-white placeholder-gray-400 font-mono min-h-[100px]"
        />
      </div>
    </div>
  );
}
