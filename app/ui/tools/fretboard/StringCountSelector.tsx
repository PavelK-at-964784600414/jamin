// String count selector component

interface StringCountSelectorProps {
  numStrings: number;
  onStringCountChange: (count: number) => void;
}

export default function StringCountSelector({ numStrings, onStringCountChange }: StringCountSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Number of Strings
      </label>
      <div className="flex space-x-2">
        {[6, 7, 8].map((count) => (
          <button
            key={count}
            onClick={() => onStringCountChange(count)}
            className={`px-3 py-2 rounded-lg transition-colors ${
              numStrings === count
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {count}
          </button>
        ))}
      </div>
    </div>
  );
}
