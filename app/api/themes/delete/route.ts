import { sql } from '@vercel/postgres';
import { NextRequest, NextResponse } from 'next/server';
import { validateApiCsrf } from '@/app/lib/api-security';
import { auth } from '@/auth';
import { logger } from '@/app/lib/logger';

export async function DELETE(request: NextRequest) {
  try {
    // Check CSRF validation for DELETE requests
    const csrfError = validateApiCsrf(request);
    if (csrfError) return csrfError;

    // Get the theme ID from the request URL or body
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { message: 'Theme ID is required' },
        { status: 400 }
      );
    }
    
    // Authenticate the user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Get the current user's ID
    const userId = session.user.id;
    
    // First check if the user is authorized to delete this theme
    const themeCheck = await sql`
      SELECT member_id FROM themes WHERE id = ${id}
    `;
    
    if (themeCheck.rows.length === 0 || !themeCheck.rows[0]) {
      return NextResponse.json(
        { message: 'Theme not found' },
        { status: 404 }
      );
    }
    
    const themeOwnerId = themeCheck.rows[0].member_id;
    
    // Verify ownership
    if (themeOwnerId !== userId) {
      return NextResponse.json(
        { message: 'Not authorized to delete this theme' },
        { status: 403 }
      );
    }
    
    // Delete the theme
    await sql`DELETE FROM themes WHERE id = ${id}`;
    
    return NextResponse.json({ message: 'Theme deleted successfully' });
  } catch (error) {
    logger.error('Error deleting theme', { metadata: { error: error instanceof Error ? error.message : String(error) } });
    return NextResponse.json(
      { message: 'Error deleting theme' },
      { status: 500 }
    );
  }
}