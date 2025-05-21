// Import only handlers from auth.js
import { handlers } from '@/auth';

// Re-export NextAuth handlers for API routes
export const { GET, POST } = handlers;
