/**
 * Simple in-memory rate limiting implementation for API routes
 * In a production environment, this should be replaced with a Redis-based solution
 * or a more robust rate limiting middleware
 */

// Store request counts for each IP
const requestCounts = new Map<string, { count: number; resetTime: number }>();

// Rate limit settings
const REQUESTS_PER_MINUTE = 60; // Allow 60 requests per minute
const WINDOW_DURATION_MS = 60 * 1000; // 1 minute window

/**
 * Checks if a request should be rate limited
 * @param clientIp The client's IP address
 * @returns An object with isLimited boolean and resetSeconds if limited
 */
export function checkRateLimit(clientIp: string): { isLimited: boolean; resetSeconds?: number } {
  const now = Date.now();
  const clientEntry = requestCounts.get(clientIp);
  
  // If no entry exists or the window has expired, create a new entry
  if (!clientEntry || now > clientEntry.resetTime) {
    requestCounts.set(clientIp, {
      count: 1,
      resetTime: now + WINDOW_DURATION_MS,
    });
    return { isLimited: false };
  }
  
  // Check if the client has exceeded the limit
  if (clientEntry.count >= REQUESTS_PER_MINUTE) {
    const resetSeconds = Math.ceil((clientEntry.resetTime - now) / 1000);
    return { 
      isLimited: true,
      resetSeconds
    };
  }
  
  // Increment the count and allow the request
  clientEntry.count++;
  requestCounts.set(clientIp, clientEntry);
  return { isLimited: false };
}

/**
 * Clean up old entries from the map periodically
 * This should be called on a timer in a real application
 */
export function cleanupRateLimiter() {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now > data.resetTime) {
      requestCounts.delete(ip);
    }
  }
}

// Set up a cleanup interval (runs every minute)
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupRateLimiter, WINDOW_DURATION_MS);
}
