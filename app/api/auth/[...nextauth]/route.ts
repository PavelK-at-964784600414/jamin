import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { authConfig } from '@/auth.config';

/**
 * Handler for NextAuth.js routes using Next.js App Router
 * This follows the NextAuth.js v5 pattern for App Router
 */

// Define a custom route handler for authentication
const handler = NextAuth({
  ...authConfig,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.image as string | undefined;
      }
      return session;
    },
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        
        try {
          const user = await sql`SELECT * FROM members WHERE email=${credentials.email}`;
          const userData = user.rows[0];
          
          if (!userData) return null;
          
          const passwordsMatch = await bcrypt.compare(
            credentials.password,
            userData.password
          );
          
          if (!passwordsMatch) return null;
          
          return {
            id: userData.id,
            name: userData.user_name,
            email: userData.email,
            image: userData.image_url,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      },
    }),
  ],
});

// Export the handler directly as both GET and POST handlers
export { handler as GET, handler as POST };