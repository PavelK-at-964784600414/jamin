import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

// NextAuth v5 configuration
export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async authorized({ auth, request: { nextUrl } }) {
      const user = auth?.user;
      if (nextUrl.pathname.startsWith('/dashboard')) return !!user;
      if (user && nextUrl.pathname === '/login') return Response.redirect(new URL('/dashboard', nextUrl));
      return true;
    },
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
      // Assign token properties to session.user
      session.user.id = token.id as string;
      session.user.name = token.name as string;
      session.user.email = token.email as string;
      session.user.image = token.image as string | undefined;
      return session;
    }
  },
  providers: [
    CredentialsProvider({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = credentials?.email;
        const password = credentials?.password;
        if (typeof email !== 'string' || typeof password !== 'string') return null;
        const res = await sql`SELECT * FROM members WHERE email=${email}`;
        const user = res.rows[0];
        if (!user) return null;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;
        return { id: user.id, name: user.user_name, email: user.email, image: user.image_url };
      }
    })
  ]
});

// Signup helper
export async function signUp(
  userName: string,
  email: string,
  password: string,
  firstName: string | null,
  lastName: string | null,
  country: string | null,
  instrument: string | null
) {
  const hashed = await bcrypt.hash(password, 10);
  const id = crypto.randomUUID();
  const img = '/members/evil-rabbit.png';
  const res = await sql`
    INSERT INTO members (id, user_name, email, password, image_url, first_name, last_name, country, instrument)
    VALUES (${id}, ${userName}, ${email}, ${hashed}, ${img}, ${firstName}, ${lastName}, ${country}, ${instrument})
    RETURNING *
  `;
  return res.rows[0];
}
