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
  const isDev = process.env.NODE_ENV === 'development';  const directives = [
    "default-src 'self'",
    // Script policy: nonce-based with strict-dynamic, unsafe-eval for dev, and necessary domains
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https://accounts.google.com https://docs.opencv.org`,
    // Style policy: allow inline styles for dynamic UI components, nonce for static styles
    `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
    // Font sources including data URIs for inline fonts
    "font-src 'self' https://fonts.gstatic.com data:",
    // Image sources including user avatars, S3, and data URIs
    `img-src 'self' data: blob: https://lh3.googleusercontent.com https://i.scdn.co ${s3Url}`,    // Connection sources for API calls, WebSockets, and external services
    `connect-src 'self' https://accounts.google.com https://docs.opencv.org ${s3Url}${isDev ? " ws: wss: ws://localhost:* wss://localhost:* http://localhost:* https://localhost:*" : ""}`,
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
  
  // Check if user is trying to access protected routes
  const { pathname } = req.nextUrl;
  const isProtectedRoute = pathname.startsWith('/dashboard');
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');
  
  // Check if user is authenticated
  const isLoggedIn = !!req.auth?.user;
  
  // Redirect logic
  if (isProtectedRoute && !isLoggedIn) {
    // Redirect to login if accessing protected route without auth
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  if (isAuthRoute && isLoggedIn) {
    // Redirect to dashboard if accessing auth pages while logged in
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }
  
  // Create response
  const response = NextResponse.next();
  
  // Set CSP header with nonce
  response.headers.set('Content-Security-Policy', createCSP(nonce));
  
  // Set nonce header for use in components
  response.headers.set('x-nonce', nonce);
    // Additional security headers (complementing next.config.js)
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('X-DNS-Prefetch-Control', 'off');
  
  // Safari-specific headers to prevent connection issues
  const userAgent = req.headers.get('user-agent') || '';
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  const isLocalhost = req.nextUrl.hostname === 'localhost' || req.nextUrl.hostname === '127.0.0.1';
  
  // Only set HSTS for non-Safari or non-localhost to prevent Safari SSL issues
  if (!isSafari || !isLocalhost) {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
    if (isSafari) {
    console.log('🍎 Safari detected - applying compatibility headers');
    
    // Only add aggressive cache control for HTML pages, not static assets
    if (!pathname.includes('/_next/static/') && !pathname.includes('.js') && !pathname.includes('.css')) {
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }
    
    // Add connection keep-alive for Safari
    response.headers.set('Connection', 'keep-alive');
    response.headers.set('Keep-Alive', 'timeout=5, max=100');
    
    // For Safari on localhost, actively prevent HTTPS caching
    if (isLocalhost) {
      response.headers.set('Clear-Site-Data', '"cache", "cookies", "storage"');
      response.headers.delete('Strict-Transport-Security'); // Explicitly remove HSTS
    }
    
    // Ensure JavaScript bundles are properly cached for Safari
    if (pathname.includes('/_next/static/chunks/') || pathname.endsWith('.js')) {
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Content-Type', 'application/javascript; charset=utf-8');
    }
  }
  
  return response;
});

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    // Apply to all paths except static assets, API routes, and Next.js internals
    // Specifically exclude JS/CSS files to prevent interference with Safari JavaScript execution
    '/((?!api|_next/static|static|favicon.ico|sw.js|manifest.json|.*\\.(?:js|css|woff|woff2|png|jpg|jpeg|gif|svg|ico)$).*)'
  ],
};