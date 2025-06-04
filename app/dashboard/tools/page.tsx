import { Suspense } from 'react';
import { lusitana } from '@/app/ui/fonts';
import dynamic from 'next/dynamic';

// Lazy load the tools client component to reduce initial bundle size
const ToolsPageClient = dynamic(() => import('./ToolsPageClient'), {
  loading: () => <div className="text-white">Loading tools...</div>,
  ssr: false // Tools are interactive, don't need SSR
});

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
      
      <ToolsPageClient />
    </div>
  );
}
