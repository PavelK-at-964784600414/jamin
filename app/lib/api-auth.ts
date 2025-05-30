import { NextResponse } from 'next/server';
import { auth } from '@/auth';

/**
 * Helper function to check if a user is authenticated in API routes
 * @returns An error response if not authenticated, null if authenticated
 */
export async function checkAuth() {
  // Get session from NextAuth
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
  // Get session from NextAuth
  const session = await auth();
  return session?.user?.id || null;
}

/**
 * Constants for file validation
 */
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB (increased for video files)
export const ALLOWED_AUDIO_TYPES = [
  'audio/webm',
  'audio/mp3',
  'audio/wav',
  'audio/mpeg',
  'video/webm', // For video recordings
  'video/mp4',  // For video recordings
  'audio/mp4',  // For audio in MP4 container
];

export const ALLOWED_VIDEO_TYPES = [
  'video/webm',
  'video/mp4',
  'video/x-msvideo', // .avi
  'video/quicktime', // .mov
];
