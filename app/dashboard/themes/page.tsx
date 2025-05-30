import Pagination from '@/app/ui/themes/pagination';
import Search from '@/app/ui/search';
import Table from '@/app/ui/themes/table';
import { CreateTheme } from '@/app/ui/themes/buttons';
import PageSizeSelector from '@/app/ui/themes/page-size-selector';
import ThemeCountInfo from '@/app/ui/themes/theme-count-info';
import { lusitana } from '@/app/ui/fonts';
import { ThemesTableSkeleton } from '@/app/ui/skeletons';
import { Suspense } from 'react';
import { fetchThemesPages, fetchFilteredThemes, fetchThemesCount } from '@/app/lib/data';
import { ThemesTableWithLikes } from '@/app/lib/definitions';
import { auth } from '@/auth';

export default async function Page({
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

  // Get current user session
  const session = await auth();
  const currentUserId = session?.user?.id;

  const [totalPages, themes, totalThemes] = await Promise.all([
    fetchThemesPages(query, perPage),
    fetchFilteredThemes(query, currentPage, perPage) as Promise<ThemesTableWithLikes[]>,
    fetchThemesCount(query)
  ]);

  console.log('Themes being passed to Table:', JSON.stringify(themes.map(t => t.id))); // Log theme IDs

  return (
    <div className="w-full">
      <div className="flex w-full items-center justify-between">
        <h1 className={`${lusitana.className} text-2xl`}>Themes</h1>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
        <Search />
        <div className="flex items-center gap-2">
          <PageSizeSelector />
          <CreateTheme />
        </div>
      </div>
      <Suspense key={query + currentPage + perPage} fallback={<ThemesTableSkeleton />}>
        <Table themes={themes} currentUserId={currentUserId} />
      </Suspense>
      <div className="mt-5 space-y-4">
        <div className="flex w-full justify-start">
          <ThemeCountInfo totalThemes={totalThemes} currentPage={currentPage} />
        </div>
        <div className="flex w-full justify-center">
          <Pagination totalPages={totalPages} />
        </div>
      </div>
    </div>
  );
}