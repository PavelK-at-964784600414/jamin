/**
 * CSRF Protection middleware and utilities for API routes
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Validates that API mutations come from our own website through the Referer header
 * @param request Next.js request object
 * @returns true if request passes CSRF check, false otherwise
 */
export function validateCsrfForApi(request: NextRequest): boolean {
  // Only apply to mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return true;
  }

  // Check the Referer header (common CSRF protection)
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  
  // If either is missing, reject the request
  if (!referer || !host) {
    return false;
  }
  
  // Check if the referer is from our site
  try {
    const refererUrl = new URL(referer);
    // The referer's host should contain our host
    return refererUrl.host.includes(host);
  } catch (error) {
    // Invalid URL in referer
    return false;
  }
}

/**
 * Middleware function to apply CSRF protection to API routes
 * @param request Next.js request object
 * @returns Response object if CSRF check fails, null otherwise
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  // Only check API routes
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return null;
  }
  
  // Validate the request
  if (!validateCsrfForApi(request)) {
    return NextResponse.json(
      { error: 'CSRF validation failed', message: 'Invalid request origin' },
      { status: 403 }
    );
  }
  
  return null;
}
