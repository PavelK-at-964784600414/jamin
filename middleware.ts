import { NextResponse } from 'next/server';
import { auth } from './auth-config';
import { analyticsMiddleware } from './analyticsMiddleware';

export async function middleware(request) {
  // Apply analytics middleware first
  analyticsMiddleware(request);
  
  // Then apply auth middleware
  return auth(request);
}

export const config = {
  matcher: [
    // Match all paths except public assets and API routes that should be public
    '/((?!api/public|_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.mp3$|.*\\.wav$|login|signup).*)',
  ],
};