import { Suspense } from 'react';
import { fetchFilteredCollaborations, fetchCollaborationsPages, fetchCollaborationsCount } from '@/app/lib/data';
import CollabPageClient from './CollabPageClient';
import Search from '@/app/ui/search';
import { lusitana } from '@/app/ui/fonts';
import Pagination from '@/app/ui/themes/pagination';
import { CollaborationDisplayDataWithLikes } from '@/app/lib/definitions';

export default async function CollabPage({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
    perPage?: string;
  }>;
}) {
  // Resolve the searchParams Promise
  const resolvedSearchParams = await searchParams || {};
  const query = resolvedSearchParams.query || '';
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const perPage = Number(resolvedSearchParams.perPage) || 6;

  const [collaborations, totalPages, totalCollaborations] = await Promise.all([
    fetchFilteredCollaborations(query, currentPage, perPage) as Promise<CollaborationDisplayDataWithLikes[]>,
    fetchCollaborationsPages(query, perPage),
    fetchCollaborationsCount(query)
  ]);

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Collaborations</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search />
      </div>
      <Suspense key={query + currentPage + perPage} fallback={<div>Loading collaborations...</div>}>
        <CollabPageClient collaborations={collaborations} />
      </Suspense>
      <div className="mt-5 space-y-4">
        <div className="flex w-full justify-start">
          <p className="text-sm text-gray-500">
            Showing {((currentPage - 1) * perPage) + 1}-{Math.min(currentPage * perPage, totalCollaborations)} of {totalCollaborations} collaborations
          </p>
        </div>
        <div className="flex w-full justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}
