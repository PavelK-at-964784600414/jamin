import { NextResponse } from 'next/server';
import { fetchThemeById, fetchLayersByThemeId } from '@/app/lib/data';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Get theme data
    const themeData = await fetchThemeById(id);
    if (!themeData) {
      return NextResponse.json(
        { error: 'Theme not found' },
        { status: 404 }
      );
    }
    
    // Get layer data
    const layersData = await fetchLayersByThemeId(id);
    
    return NextResponse.json({ 
      theme: themeData,
      layers: layersData 
    });
  } catch (error) {
    console.error('Error fetching theme data:', error);
    return NextResponse.json(
      { error: 'Failed to load theme data' },
      { status: 500 }
    );
  }
}