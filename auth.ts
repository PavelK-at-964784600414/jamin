console.log("AUTH.TS IS BEING PROCESSED - TOP OF FILE");
// throw new Error("AUTH.TS EXECUTION CONFIRMED - DELIBERATE CRASH"); // Uncomment to test if it crashes

import NextAuth, { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google'; // Uncommented GoogleProvider
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid'; // Import uuid
import type { JWT } from 'next-auth/jwt';
import type { Session } from 'next-auth';
import type { NextRequest } from 'next/server'; // Re-enabled NextRequest

// Define our own type structure for Auth to avoid import issues
type AuthSession = { // Re-enabled AuthSession type
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
};

type AuthorizedCallbackParams = { // Re-enabled AuthorizedCallbackParams type
  auth: AuthSession | null;
  request: NextRequest; // Use NextRequest directly
};

export const nextAuthConfig: NextAuthConfig = { // Export nextAuthConfig
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        // For Google sign-in, profile should be available and contain user details
        if (!profile?.email) {
          console.error("[AUTH_SIGNIN_GOOGLE] Email not found in Google profile");
          return false; // Or redirect to an error page
        }
        try {
          const googleUserEmail = profile.email;
          const googleUserName = profile.name;
          const googleUserImage = (profile as any).picture; // Google often uses 'picture' for image URL
          const googleUserId = user.id; // This is the ID from Google, to be used as our member_id

          if (!googleUserId) {
            console.error("[AUTH_SIGNIN_GOOGLE] User ID not found from Google account");
            return false;
          }

          // Check if user already exists in our members table by their Google ID
          const existingMember = await sql`SELECT * FROM members WHERE id = ${googleUserId}`;

          if (existingMember.rows.length === 0) {
            // User does not exist, create them
            console.log(`[AUTH_SIGNIN_GOOGLE] New Google user: ${googleUserEmail}. Creating member record.`);
            // Add a placeholder for the password field for Google users
            const placeholderPassword = 'OAUTH_USER_NO_PASSWORD'; 
            await sql`
              INSERT INTO members (id, email, user_name, image_url, created_at, password)
              VALUES (${googleUserId}, ${googleUserEmail}, ${googleUserName}, ${googleUserImage}, NOW(), ${placeholderPassword})
            `;
            console.log(`[AUTH_SIGNIN_GOOGLE] Member record created for ${googleUserEmail} with ID ${googleUserId}`);
          } else {
            // User exists, optionally update their details if they changed
            console.log(`[AUTH_SIGNIN_GOOGLE] Existing Google user: ${googleUserEmail}. Verifying details.`);
            const member = existingMember.rows[0];
            if (member.user_name !== googleUserName || member.image_url !== googleUserImage) {
              await sql`
                UPDATE members 
                SET user_name = ${googleUserName}, image_url = ${googleUserImage} 
                WHERE id = ${googleUserId}
              `;
              console.log(`[AUTH_SIGNIN_GOOGLE] Updated details for ${googleUserEmail}`);
            }
          }
          return true; // Allow sign-in
        } catch (error) {
          console.error("[AUTH_SIGNIN_GOOGLE] Error processing Google sign-in:", error);
          return false; // Prevent sign-in on error
        }
      }
      return true; // Default to allow other sign-ins (e.g., credentials)
    },
    async authorized({ auth, request }: AuthorizedCallbackParams) { // Re-enabled authorized callback
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      // Simplified initial log to avoid potential JSON.stringify issues
      console.log('[AUTH_CALLBACK] Path:', pathname, '| IsLoggedIn:', isLoggedIn, '| Auth object present:', !!auth);
      if (auth) {
        console.log('[AUTH_CALLBACK] Auth user object present:', !!auth.user, '| User details:', JSON.stringify(auth.user));
      }

      const isOnDashboard = pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) {
          console.log('[AUTH_CALLBACK] User is logged in. Allowing access to dashboard.');
          return true;
        }
        console.log('[AUTH_CALLBACK] User is NOT logged in. Redirecting to /login from dashboard attempt.');
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn && pathname === '/login') {
        console.log('[AUTH_CALLBACK] User is logged in and on /login page. Redirecting to /dashboard.');
        return Response.redirect(new URL('/dashboard', request.nextUrl));
      }
      console.log('[AUTH_CALLBACK] Path not /dashboard or /login (or user not logged in on /login). Allowing.');
      return true;
    },
    async jwt({ token, user }: { token: JWT; user?: any }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      (session.user as any).id = token.id as string;
      (session.user as any).name = token.name as string;
      (session.user as any).email = token.email as string;
      (session.user as any).image = token.image as string | undefined;
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
    }),
    GoogleProvider({ // Uncommented GoogleProvider configuration
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ]
};

let authExports;
try {
  console.log("Attempting to initialize NextAuth with Credentials, Google & authorized callback..."); // Updated log message
  authExports = NextAuth(nextAuthConfig);
  console.log("NextAuth initialized. authExports:", authExports);
  if (authExports && authExports.handlers) {
    console.log("Handlers object IS defined:", authExports.handlers);
  } else {
    console.error("Handlers object is UNDEFINED after NextAuth initialization.");
  }
} catch (error) {
  console.error("Error initializing NextAuth (with Credentials & authorized callback):", error);
  authExports = {
    handlers: {
      GET: () => new Response("NextAuth (with CredentialsProvider) initialization failed. Check server logs.", { status: 500 }),
      POST: () => new Response("NextAuth (with CredentialsProvider) initialization failed. Check server logs.", { status: 500 }),
    },
    auth: async () => {
      console.error("CRITICAL: auth() (with CredentialsProvider) called but NextAuth failed to initialize.");
      return null;
    },
    signIn: async () => {
      console.error("CRITICAL: signIn() (with CredentialsProvider) called but NextAuth failed to initialize.");
      return { ok: false, error: "NextAuthInitError" };
    },
    signOut: async () => {
      console.error("CRITICAL: signOut() (with CredentialsProvider) called but NextAuth failed to initialize.");
      throw new Error("NextAuth (with CredentialsProvider) failed to initialize. Cannot sign out.");
    },
  };
}

export const { handlers, auth, signIn, signOut } = authExports;

export async function signUp(
  userName: string,
  email: string,
  password: string,
  firstName: string | null,
  lastName: string | null,
  country: string | null,
  instrument: string | null
) {
  console.log(`[AUTH_SIGNUP] Attempting to sign up user: ${email}`);
  try {
    // Check if user already exists
    const existingUser = await sql`SELECT * FROM members WHERE email = ${email}`;
    if (existingUser.rows.length > 0) {
      console.warn(`[AUTH_SIGNUP] User already exists with email: ${email}`);
      return { error: "User already exists with this email." };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4(); // Generate a new UUID for the user

    // Insert new user into the database
    await sql`
      INSERT INTO members (id, user_name, email, password, first_name, last_name, country, instrument, created_at, image_url)
      VALUES (${userId}, ${userName}, ${email}, ${hashedPassword}, ${firstName}, ${lastName}, ${country}, ${instrument}, NOW(), NULL)
    `;

    console.log(`[AUTH_SIGNUP] User ${email} signed up successfully with ID: ${userId}`);
    return { success: "User signed up successfully. Please log in." };
  } catch (error) {
    console.error(`[AUTH_SIGNUP] Error during sign up for ${email}:`, error);
    return { error: "An error occurred during sign up. Please try again." };
  }
}
