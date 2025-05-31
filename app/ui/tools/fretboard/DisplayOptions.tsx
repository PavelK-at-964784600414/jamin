// Display options component

interface DisplayOptionsProps {
  showNoteNames: boolean;
  highlightRoot: boolean;
  onShowNoteNamesChange: (show: boolean) => void;
  onHighlightRootChange: (highlight: boolean) => void;
}

export default function DisplayOptions({
  showNoteNames,
  highlightRoot,
  onShowNoteNamesChange,
  onHighlightRootChange,
}: DisplayOptionsProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Display Options
      </label>
      <div className="space-y-2">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={showNoteNames}
            onChange={(e) => onShowNoteNamesChange(e.target.checked)}
            className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-300">Show Note Names</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={highlightRoot}
            onChange={(e) => onHighlightRootChange(e.target.checked)}
            className="rounded bg-gray-700 border-gray-600 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2 text-sm text-gray-300">Highlight Root Notes</span>
        </label>
      </div>
    </div>
  );
}
