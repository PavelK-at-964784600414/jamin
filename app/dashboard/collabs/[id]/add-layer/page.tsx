import { fetchCollaborationById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import AddLayerToCollabContent from './add-layer-content';
import { logger } from '@/app/lib/logger';

// This is a server component that will fetch the collaboration data server-side
export default async function AddLayerToCollabPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolve the params Promise
  const { id } = await params;
  
  try {
    if (!id) {
      throw new Error('Invalid collaboration ID');
    }
    
    // Fetch the collaboration data server-side
    const collaboration = await fetchCollaborationById(id);
    
    if (!collaboration) {
      notFound();
    }
    
    // Now we're guaranteed to have a collaboration
    return <AddLayerToCollabContent collaboration={collaboration} />;
  } catch (err) {
    logger.error('Error loading collaboration', { metadata: { data: err } });
    return <div className="p-4 bg-red-900 text-white rounded-md">
      Failed to load collaboration. Please try again.
    </div>;
  }
}
