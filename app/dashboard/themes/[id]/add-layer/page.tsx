import { fetchThemeById } from '@/app/lib/data';
import { notFound } from 'next/navigation';
import AddLayerPageContent from './add-layer-content';
import { themeFormToThemesTable } from '@/app/lib/type-converters';

// This is a server component that will fetch the theme data server-side
export default async function AddLayerPage({ params }: { params: Promise<{ id: string }> }) {
  // Resolve the params Promise
  const { id } = await params;
  
  try {
    if (!id) {
      throw new Error('Invalid theme ID');
    }
    
    // Fetch the theme data server-side
    const themeForm = await fetchThemeById(id);
    
    if (!themeForm) {
      notFound();
    }
    
    // Convert ThemeForm to ThemesTable for the AddLayerPageContent
    const theme = themeFormToThemesTable(themeForm);
    
    // Now we're guaranteed to have a theme
    return <AddLayerPageContent theme={theme} />;
  } catch (err) {
    console.error('Error loading theme:', err);
    return <div className="p-4 bg-red-900 text-white rounded-md">
      Failed to load theme. Please try again.
    </div>;
  }
}
