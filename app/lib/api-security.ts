import { NextResponse } from 'next/server';

/**
 * Validate that an API request came from our own site
 * @param request Request object
 * @returns A response with a 403 error if validation fails, or null if the request is valid
 */
export function validateApiCsrf(request: Request): NextResponse | null {
  // Skip validation for non-mutating methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }
  
  // Check the referer header
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');
  const requestedWith = request.headers.get('x-requested-with');
  
  // Double CSRF check: verify referer matches host AND X-Requested-With header is present
  // Either the referer check must pass, or the X-Requested-With header must be present
  const refererValid = referer && host && referer.includes(host);
  const xhrHeaderValid = requestedWith === 'XMLHttpRequest';
  
  if (!refererValid && !xhrHeaderValid) {
    return NextResponse.json({
      error: 'CSRF validation failed',
      message: 'Request blocked for security reasons'
    }, { status: 403 });
  }
  
  return null;
}
