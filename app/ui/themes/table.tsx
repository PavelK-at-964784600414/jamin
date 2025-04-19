import ThemesTableClient from './ThemesTableClient';
import { fetchFilteredThemes } from '@/app/lib/data';

export default async function ThemesTable({ query, currentPage }: { query: string; currentPage: number }) {
  const themes = await fetchFilteredThemes(query, currentPage);
  return <ThemesTableClient themes={themes} />;
}
