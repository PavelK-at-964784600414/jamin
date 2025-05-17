import { NextRequest, NextResponse } from 'next/server';
import { analyticsMiddleware } from './analyticsMiddleware';
import { csrfMiddleware } from './app/lib/csrf';

// Define the middleware function type
type MiddlewareFunction = (request: NextRequest) => NextResponse | null | Promise<NextResponse | null>;

// Create a middleware that applies multiple middlewares in sequence
function composeMiddleware(middlewares: MiddlewareFunction[]) {
  return async function(request: NextRequest) {
    let response: NextResponse | null = null;
    
    for (const middleware of middlewares) {
      // Skip remaining middlewares if one returns a response
      if (response) return response;
      
      try {
        response = await middleware(request);
      } catch (error) {
        console.error('Middleware error:', error);
        return NextResponse.error();
      }
    }
    
    // Allow the request to continue if no middleware returned a response
    return response || NextResponse.next();
  };
}

// Define the middleware functions in order
const middlewareFunctions: MiddlewareFunction[] = [
  // Apply analytics middleware
  analyticsMiddleware,
  
  // Apply CSRF protection for API routes
  (request: NextRequest) => {
    const csrfResult = csrfMiddleware(request);
    return csrfResult || null;
  },
];

// Export the combined middleware
export default composeMiddleware(middlewareFunctions);

// Configure which routes should be processed by this middleware
export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.mp3$|.*\\.wav$).*)'],
};