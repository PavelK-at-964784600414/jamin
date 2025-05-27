import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';
import { fetchAllLayersWithParentThemes } from '@/app/lib/data'; // Import the new function
import { LayerWithParentTheme } from '@/app/lib/definitions'; // Import the type
import Image from 'next/image'; // Import Image for potential use with user avatars
import { formatDateToLocal } from '@/app/lib/utils'; // For formatting dates

export default async function CollabPage() {
  const layers = await fetchAllLayersWithParentThemes();

  return (
    <main>
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Collaborations
      </h1>
      <p className="mb-4 text-gray-200">
        This page shows music collaborations where themes have received additional layers or recordings from other users.
      </p>

      <div className="mt-6 flow-root">
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden rounded-md bg-gray-800 p-2 md:pt-0">
              {layers && layers.length > 0 ? (
                <ul className="divide-y divide-gray-700">
                  {layers.map((layer: LayerWithParentTheme) => (
                    <li key={layer.layer_id} className="p-4 hover:bg-gray-750 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-lg font-semibold text-yellow-400">{layer.layer_title}</p>
                          <p className="text-sm text-gray-300">Instrument: {layer.layer_instrument}</p>
                          <p className="text-xs text-gray-400">Added by: {layer.layer_creator_name} on {formatDateToLocal(layer.layer_date)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-md text-gray-200">Parent Theme: {layer.parent_theme_title}</p>
                          <p className="text-xs text-gray-400">By: {layer.parent_theme_creator_name}</p>
                          <a href={`/dashboard/themes/${layer.parent_theme_id}`} className="text-xs text-blue-400 hover:underline">View Parent Theme</a>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-gray-300">
                  No collaborations available yet. When a theme receives additional recordings or layers from other users,
                  they will appear here.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
