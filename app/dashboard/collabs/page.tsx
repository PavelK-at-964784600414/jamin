import { Suspense } from 'react';
import { fetchCollaborationData } from '@/app/lib/data';
import CollabPageClient from './CollabPageClient';

export default async function CollabPage() {
  const collaborations = await fetchCollaborationData();

  return <CollabPageClient collaborations={collaborations} />;
}
