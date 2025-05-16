import { fetchThemeById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import AddLayerPageContent from './add-layer-content';

// This is a server component that will fetch the theme data server-side
export default async function AddLayerPage({ params }: { params: { id: string } }) {
  const id = params.id;
  
  try {
    if (!id) {
      throw new Error('Invalid theme ID');
    }
    
    // Fetch the theme data server-side
    const theme = await fetchThemeById(id);
    
    if (!theme) {
      notFound();
    }
    
    // Now we're guaranteed to have a theme
    return <AddLayerPageContent theme={theme} />;
  } catch (err) {
    console.error('Error loading theme:', err);
    return <div className="p-4 bg-red-900 text-white rounded-md">
      Failed to load theme. Please try again.
    </div>;
  }
}
