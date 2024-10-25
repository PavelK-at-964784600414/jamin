import Pagination from '@/app/ui/invoices/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/members/table';
import { fetchMembers, fetchMembersPages } from '@/app/lib/data';
import { lusitana } from '@/app/ui/fonts';
import { Suspense } from 'react';
import { MembersTableSkeleton } from '@/app/ui/skeletons';


export default async function Page({
  searchParams,
}: {
  searchParams?: {
    query?: string;
    page?: string;
  };
}) {
  const query = searchParams?.query || '';
  const currentPage = Number(searchParams?.page) || 1;
  const totalPages = await fetchMembersPages(query);
  const members = await fetchMembers();
  console.log(members);
  return( 
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Members</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search />
      </div>
      <Suspense key={query + currentPage} fallback={<MembersTableSkeleton />}>
        <Table members = {members}/>
      </Suspense> 
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}