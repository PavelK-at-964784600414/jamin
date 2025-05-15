import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth-config'; // Import from the correct location
import { analyticsMiddleware } from './analyticsMiddleware';
import { csrfMiddleware } from './app/lib/csrf';

export default async function middleware(request: NextRequest) {
  // Apply analytics middleware
  const response = analyticsMiddleware(request);
  
  // Apply CSRF protection for API routes
  const csrfResult = csrfMiddleware(request);
  if (csrfResult) {
    return csrfResult;
  }

  // Apply authentication middleware
  return auth(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.mp3$|.*\\.wav$).*)'],
};