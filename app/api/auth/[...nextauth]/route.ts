// Import the NextAuth handlers from auth.ts
import { handlers } from '@/auth';
// Export for Next.js API routes
export const { GET, POST } = handlers;
