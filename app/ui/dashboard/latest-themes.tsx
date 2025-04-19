import { ArrowPathIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';
import Image from 'next/image';
import { lusitana } from '@/app/ui/fonts';
import { fetchLatestThemes } from '@/app/lib/data';

export default async function LatestThemes() {
  const latestThemes = await fetchLatestThemes();
  return (
    <div className="flex w-full flex-col md:col-span-4">
      <h2 className={`${lusitana.className} mb-4 text-xl text-gray-200 md:text-2xl`}>
        Latest Themes
      </h2>
      <div className="flex grow flex-col justify-between rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 p-4 shadow-lg">
        <div className="bg-gray-800 rounded-lg p-6">
          {latestThemes.map((theme, i) => {
            const imageUrl = theme.image_url.replace('/public', '');
            return (
              <div key={theme.id} className="flex flex-col">
                <div className="flex items-center space-x-4 py-2 hover:bg-gray-700 rounded-lg transition-colors duration-200">
                  <Image
                    className="h-10 w-10 rounded-full"
                    src={imageUrl}
                    alt={theme.name}
                    width={40}
                    height={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white md:text-base">
                      {theme.name}
                    </p>
                    <p className="truncate text-sm text-gray-400 sm:block">
                      {theme.member}
                    </p>
                  </div>
                  <p
                    className={`${lusitana.className} truncate text-sm font-medium text-gray-300 md:text-base`}
                  >
                    {theme.seconds}
                  </p>
                </div>
                {i < latestThemes.length - 1 && (
                  <hr className="border-t border-gray-600" />
                )}
              </div>
            );
          })}
        </div>
        <div className="flex items-center pb-2 pt-6">
          <ArrowPathIcon className="h-5 w-5 text-gray-400" />
          <h3 className="ml-2 text-sm text-gray-400">Updated just now</h3>
        </div>
      </div>
    </div>
  );
}