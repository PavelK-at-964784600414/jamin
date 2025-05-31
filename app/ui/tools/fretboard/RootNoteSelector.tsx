// Root note selector component

import { NOTES } from './constants';

interface RootNoteSelectorProps {
  selectedRoot: string;
  onRootChange: (root: string) => void;
}

export default function RootNoteSelector({ selectedRoot, onRootChange }: RootNoteSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Root Note
      </label>
      <select
        value={selectedRoot}
        onChange={(e) => onRootChange(e.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {NOTES.map((note) => (
          <option key={note} value={note}>
            {note}
          </option>
        ))}
      </select>
    </div>
  );
}
