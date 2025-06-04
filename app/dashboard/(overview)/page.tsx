import CardWrapper from '@/app/ui/dashboard/cards';
import RecentCollaborations from '@/app/ui/dashboard/collab-chart';
import LatestThemes from '@/app/ui/dashboard/latest-themes';
import { lusitana } from '@/app/ui/fonts';
import { fetchCardData } from '@/app/lib/data';
import { Suspense } from 'react';
import { CollabChartSkeleton, LatestThemesSkeleton, CardsSkeleton } from '@/app/ui/skeletons';
import { logger } from '@/app/lib/logger';

export default async function Page() {
  logger.debug('On dashboard page');

  return (
    <main>
      {/* Dashboard title now rendered here, or specific page title */}
      <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl`}>
        Dashboard Overview
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Suspense fallback={<CardsSkeleton />}>
          <CardWrapper />
        </Suspense>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-4 lg:grid-cols-8">
        <Suspense fallback={<CollabChartSkeleton />}>
          <RecentCollaborations />
        </Suspense>        
        <Suspense fallback={<LatestThemesSkeleton />}>
          <LatestThemes />
        </Suspense>  
      </div>
    </main>
  );
}