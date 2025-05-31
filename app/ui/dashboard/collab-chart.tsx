import { ArrowPathIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { fetchFilteredCollaborations } from '@/app/lib/data';
import { formatDateToLocal } from '@/app/lib/utils';

export default async function RecentCollaborations() {
  // Fetch the 5 most recent collaborations
  const recentCollaborations = await fetchFilteredCollaborations('', 1, 5);
  
  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl text-gray-200 md:text-2xl`}>
        Recent Collaborations
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 p-4 shadow-lg">
        <div className="bg-gray-800 rounded-lg p-6">
          {recentCollaborations.length > 0 ? (
            recentCollaborations.map((collab, i) => {
              const imageUrl = collab.collab_creator_image_url?.replace('/public', '') || '/members/user.png';
              return (
                <div key={collab.collab_id} className="flex flex-col">
                  <div className="flex items-center space-x-4 py-2 hover:bg-gray-700 rounded-lg transition-colors duration-200">
                    <Image
                      className="h-10 w-10 rounded-full"
                      src={imageUrl}
                      alt={collab.collab_creator_name}
                      width={40}
                      height={40}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white md:text-base">
                        {collab.collab_title} ({collab.collab_instrument})
                      </p>
                      <p className="truncate text-sm text-gray-400 sm:block">
                        by {collab.collab_creator_name} • {collab.total_layers_count} layers
                      </p>
                      <p className="truncate text-xs text-gray-500 sm:block">
                        Built on: {collab.parent_theme_title}
                      </p>
                    </div>
                    <p
                      className={`${lusitana.className} truncate text-sm font-medium text-gray-300 md:text-base`}
                    >
                      {formatDateToLocal(collab.collab_date)}
                    </p>
                  </div>
                  {i < recentCollaborations.length - 1 && (
                    <hr className="border-t border-gray-600" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No collaborations yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Start by adding layers to existing themes
              </p>
            </div>
          )}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-400" />
          <h3 className="ml-2 text-sm text-gray-400">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}