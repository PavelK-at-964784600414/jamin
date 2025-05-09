import Pagination from '@/app/ui/themes/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/themes/table';
import PrettyThemesTable from "@/app/ui/themes/pretty-themes-table"
import { CreateTheme } from '@/app/ui/themes/buttons';
import { lusitana } from '@/app/ui/fonts';
import { ThemesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchThemesPages } from '@/app/lib/data';

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

  const totalPages = await fetchThemesPages(query);

   return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Themes</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search />
        <CreateTheme />
      </div>
      <Suspense key={query + currentPage} fallback={<ThemesTableSkeleton />}>
        <Table query={query} currentPage={currentPage} />
      </Suspense>
      <div className="mt-5 flex w-full justify-center">
        <Pagination totalPages={totalPages} />
      </div>
    </div>
  );
}