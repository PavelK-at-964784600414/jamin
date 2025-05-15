import { NextResponse } from 'next/server';
import { fetchThemeById, fetchLayersByThemeId } from '@/app/lib/data';
import { checkAuth } from '@/app/lib/api-auth';
import { checkRateLimit } from '@/app/lib/rate-limiter';
import { validateApiCsrf } from '@/app/lib/api-security';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check CSRF validation for non-GET requests
    const csrfError = validateApiCsrf(request);
    if (csrfError) return csrfError;

    // Check if user is authenticated
    const authError = await checkAuth();
    if (authError) return authError;
    
    // Apply rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown-ip';
    const { isLimited, resetSeconds } = checkRateLimit(clientIp);
    
    if (isLimited) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again in ${resetSeconds} seconds.` 
        },
        { 
          status: 429,
          headers: {
            'Retry-After': String(resetSeconds)
          }
        }
      );
    }
    
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