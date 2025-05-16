import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';

/**
 * Helper function to check if a user is authenticated in API routes
 * @returns An error response if not authenticated, null if authenticated
 */
export async function checkAuth() {
  // Use dynamic import to avoid issues with module resolution
  const { auth } = await import('../../../auth-config.js');
  const session = await auth();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized. Please log in.' },
      { status: 401 }
    );
  }
  
  return null; // User is authenticated
}

/**
 * Get the current user's memberId from session
 * @returns The member ID or null if not authenticated
 */
export async function getCurrentMemberId() {
  // Use dynamic import to avoid issues with module resolution
  const { auth } = await import('../../../auth-config.js');
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * Constants for file validation
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mp3',
  'audio/wav',
  'audio/mpeg',
  'video/webm', // For video recordings
];
