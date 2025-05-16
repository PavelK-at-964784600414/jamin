'use client';

import { ThemesTable } from '@/app/lib/definitions';
import AddLayerForm from '@/app/ui/themes/add-layer-form';

export default function AddLayerPageContent({ theme }: { theme: ThemesTable }) {
  return (
    <div className="w-full">
      <div className="mb-8 bg-gray-800 p-6 rounded-lg">
        <h1 className="text-2xl font-bold text-white mb-4">Add Layer to &quot;{theme.title}&quot;</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-300 mb-2">Original Theme Details</h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-gray-200">
              <dt className="text-gray-400">Artist:</dt>
              <dd>{theme.user_name}</dd>
              <dt className="text-gray-400">Key:</dt>
              <dd>{theme.key}</dd>
              <dt className="text-gray-400">Tempo:</dt>
              <dd>{theme.tempo} BPM</dd>
              <dt className="text-gray-400">Duration:</dt>
              <dd>{Math.floor(theme.seconds / 60)}:{(theme.seconds % 60).toString().padStart(2, '0')}</dd>
              {theme.instrument && (
                <>
                  <dt className="text-gray-400">Instrument:</dt>
                  <dd>{theme.instrument}</dd>
                </>
              )}
            </dl>
          </div>
          <div>
            {theme.description && (
              <>
                <h2 className="text-lg font-semibold text-gray-300 mb-2">Description</h2>
                <p className="text-gray-200 bg-gray-700 p-3 rounded-md">{theme.description}</p>
              </>
            )}
            {theme.chords && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-gray-300 mb-2">Chords</h2>
                <pre className="text-gray-200 bg-gray-700 p-3 rounded-md whitespace-pre-wrap font-mono text-sm">{theme.chords}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      <AddLayerForm theme={theme} />
    </div>
  );
}
