import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';

export default async function CollabPage() {
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
              {/* Table or grid to display collaborations will go here */}
              <div className="p-4 text-gray-300">
                No collaborations available yet. When a theme receives additional recordings or layers from other users,
                they will appear here.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
