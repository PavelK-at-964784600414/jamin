// Fret count selector component

interface FretCountSelectorProps {
  numFrets: number;
  onFretCountChange: (count: number) => void;
}

export default function FretCountSelector({ numFrets, onFretCountChange }: FretCountSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Frets to Show
      </label>
      <select
        value={numFrets}
        onChange={(e) => onFretCountChange(Number(e.target.value))}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value={12}>12 Frets</option>
        <option value={15}>15 Frets</option>
        <option value={18}>18 Frets</option>
        <option value={21}>21 Frets</option>
        <option value={24}>24 Frets</option>
      </select>
    </div>
  );
}
