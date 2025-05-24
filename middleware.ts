import NextAuth from 'next-auth';
import { nextAuthConfig } from './auth'; // Import the exported config

const { auth: middleware } = NextAuth(nextAuthConfig); // Initialize NextAuth and get the middleware

export default middleware;

// Configure middleware to run on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'], // Apply to all paths except specified static ones
};