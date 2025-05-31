import { NextRequest, NextResponse } from 'next/server';
import { auth } from './auth'; // Import the auth function directly

// Generate a random nonce for CSP
function generateNonce(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Create Content Security Policy with nonce
function createCSP(nonce: string): string {
  const s3Bucket = process.env.AWS_BUCKET_NAME;
  const s3Region = process.env.AWS_REGION;
  const s3Url = s3Bucket && s3Region 
    ? `https://${s3Bucket}.s3.${s3Region}.amazonaws.com`
    : '';

  // Check if we're in development mode
  const isDev = process.env.NODE_ENV === 'development';
  const directives = [
    "default-src 'self'",
    // Script policy: nonce-based with strict-dynamic, unsafe-eval for dev, and necessary domains
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://accounts.google.com https://docs.opencv.org`,
    // Style policy: nonce-based with unsafe-inline for CSS-in-JS libraries like Framer Motion
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://fonts.googleapis.com`,
    // Font sources including data URIs for inline fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    // Image sources including user avatars, S3, and data URIs
    `img-src 'self' data: blob: https://lh3.googleusercontent.com https://i.scdn.co ${s3Url}`,
    // Connection sources for API calls, WebSockets, and external services
    `connect-src 'self' https://accounts.google.com https://docs.opencv.org ${s3Url}${isDev ? " ws: wss: ws://localhost:* wss://localhost:*" : ""}`,
    // Frame sources for OAuth flows
    "frame-src 'self' https://accounts.google.com",
    // Media sources for audio/video content
    `media-src 'self' data: blob: ${s3Url}`,
    // Child sources for workers and frames
    `child-src 'self' blob:`,
    // No object embedding for security
    "object-src 'none'",
    // Base URI restriction
    "base-uri 'self'",
    // Form action restriction
    "form-action 'self'",
    // Frame ancestors restriction (prevents clickjacking)
    "frame-ancestors 'none'",
    // Manifest source for PWA
    "manifest-src 'self'",
    // Upgrade insecure requests in production only
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
    // Worker sources for service workers and web workers
    "worker-src 'self' blob:"
  ];

  return directives.filter(directive => directive.trim()).join('; ');
}

export default auth((req: any) => {
  // Generate nonce for this request
  const nonce = generateNonce();
  
  // Create response
  const response = NextResponse.next();
  
  // Set CSP header with nonce
  response.headers.set('Content-Security-Policy', createCSP(nonce));
  
  // Set nonce header for use in components
  response.headers.set('x-nonce', nonce);
  
  // Additional security headers (complementing next.config.js)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  return response;
});

// Configure middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)'], // Apply to all paths except specified static ones
};