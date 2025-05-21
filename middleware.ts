// Use NextAuth v5 middleware from our auth.ts
export { auth as middleware } from './auth';

// Configure middleware to run on dashboard routes only
export const config = {
  matcher: ['/dashboard/:path*'],
};