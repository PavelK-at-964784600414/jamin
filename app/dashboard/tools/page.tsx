import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';
import ToolsPageClient from './ToolsPageClient';

export default async function ToolsPage() {
  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl text-white mb-6`}>
          Musician Tools
        </h1>
      </div>
      <p className="mb-8 text-gray-400">
        Professional music tools to enhance your creativity and workflow. Access chord generators, metronomes, and instrument-specific assistance.
      </p>
      
      <Suspense fallback={<div className="text-white">Loading tools...</div>}>
        <ToolsPageClient />
      </Suspense>
    </div>
  );
}
