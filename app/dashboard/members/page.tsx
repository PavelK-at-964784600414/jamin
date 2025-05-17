import DarkPagination from '@/app/ui/dark-pagination';
import DarkSearch from '@/app/ui/dark-search';
import Table from '@/app/ui/members/table';
import { fetchMembers, fetchMembersPages } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { DarkMembersTableSkeleton } from '@/app/ui/dark-members-skeleton';


export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<{
    query?: string;
    page?: string;
  }>;
}) {
  // Await the searchParams Promise
  const resolvedSearchParams = await searchParams || {};
  const query = resolvedSearchParams.query || '';
  const currentPage = Number(resolvedSearchParams.page) || 1;
  const totalPages = await fetchMembersPages(query);
  const members = await fetchMembers(query);
  return( 
    <div className="w-full bg-gray-900 p-6 rounded-lg shadow-lg">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl text-white`}>Members</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <DarkSearch placeholder="Search members..." />
      </div>
      <Suspense key={query + currentPage} fallback={<DarkMembersTableSkeleton />}>
        <Table members = {members}/>
      </Suspense> 
      <div className="mt-5 flex w-full justify-center">
        <DarkPagination totalPages={totalPages} />
      </div>
    </div>
  );
}