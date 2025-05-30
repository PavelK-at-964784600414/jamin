'use client';

import { useSearchParams } from 'next/navigation';

interface ThemeCountInfoProps {
  totalThemes: number;
  currentPage: number;
}

export default function ThemeCountInfo({ totalThemes, currentPage }: ThemeCountInfoProps) {
  const searchParams = useSearchParams();
  const perPage = Number(searchParams.get('perPage')) || 6;
  
  const startItem = Math.min((currentPage - 1) * perPage + 1, totalThemes);
  const endItem = Math.min(currentPage * perPage, totalThemes);
  
  if (totalThemes === 0) {
    return (
      <p className="text-sm text-gray-600">
        No themes found
      </p>
    );
  }
  
  return (
    <p className="text-sm text-gray-600">
      Showing {startItem}-{endItem} of {totalThemes} themes
    </p>
  );
}
