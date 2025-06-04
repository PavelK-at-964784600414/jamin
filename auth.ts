import { logger } from './app/lib/logger';
logger.debug("AUTH.TS IS BEING PROCESSED - TOP OF FILE");
// throw new Error("AUTH.TS EXECUTION CONFIRMED - DELIBERATE CRASH"); // Uncomment to test if it crashes

import NextAuth, { type NextAuthConfig, type Account, type Profile, type User, type Session as NextAuthSession } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google'; 
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid'; 
import type { JWT } from 'next-auth/jwt';
import type { NextRequest } from 'next/server'; 
import { NextResponse } from 'next/server'; // Import NextResponse

// Define our own type structure for Auth to avoid import issues
// This AuthSession might be redundant if NextAuthSession from 'next-auth' is used consistently.
// Consider replacing AuthSession with NextAuthSession where appropriate.
type AuthSession = { 
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
  expires?: string; // Added to match NextAuthSession more closely if needed
};

export async function signUp(
  userName: string,
  email: string,
  password: string,
  firstName?: string | null,
  lastName?: string | null,
  country?: string | null,
  instrument?: string | null,
) {
  logger.debug(`[AUTH_SIGNUP] Attempting to register new user: ${email}, username: ${userName}`);
  try {
    // Check if user already exists (by email or username)
    const existingUserResult = await sql`
      SELECT id FROM members WHERE email = ${email} OR user_name = ${userName}
    `;
    if (existingUserResult.rows.length > 0) {
      logger.error(`[AUTH_SIGNUP] User already exists with email ${email} or username ${userName}.`);
      throw new Error('User with this email or username already exists.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const newMemberId = uuidv4();    // Insert new user
    // Ensure column names match your database schema.    // Assuming: first_name, last_name, country, instrument
    await sql`
      INSERT INTO members (
        id, 
        user_name, 
        email, 
        password, 
        first_name, 
        last_name, 
        country, 
        instrument, 
        image_url,
        created_at
      )
      VALUES (
        ${newMemberId}, 
        ${userName}, 
        ${email}, 
        ${hashedPassword}, 
        ${firstName}, 
        ${lastName}, 
        ${country}, 
        ${instrument}, 
        '/placeholder.svg',
        NOW()
      )
    `;
    logger.debug(`[AUTH_SIGNUP] User ${email} registered successfully with ID: ${newMemberId}.`);
    // Optionally, return the new user object or ID, though actions.ts doesn't currently use it.
    return { id: newMemberId, email, userName };
  } catch (error) {
    logger.error(`[AUTH_SIGNUP] Error during user registration for ${email}:`, error);
    // Re-throw the error to be caught by the calling server action
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during sign up.');
  }
}

// For the authorized callback, NextAuth expects specific parameter types.
// The `auth` parameter is typically `Session | null` (imported from `next-auth` as `NextAuthSession`).
export const nextAuthConfig: NextAuthConfig = { 
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  callbacks: {
    async signIn({ user, account, profile }: { user: User | any; account?: Account | null; profile?: Profile }) {
      if (account?.provider === "google") {
        if (!profile || !profile.email) {
          logger.error("[AUTH_SIGNIN_GOOGLE] Profile or email not found in Google profile.");
          return false; 
        }
        const googleUserEmail = profile.email;
        const googleUserName = profile.name ?? ''; 
        const googleUserImage = (profile as any).picture ?? '';
        const googleProviderId = profile.sub ?? (user as any).id; 

        if (!googleProviderId) {
          logger.error("[AUTH_SIGNIN_GOOGLE] Google Provider ID (profile.sub or user.id) not found.");
          return false;
        }
        try {
          let memberResult = await sql`SELECT * FROM members WHERE google_provider_id = ${googleProviderId}`;
          let memberRecord = memberResult.rows[0];
          if (memberRecord) {
            logger.debug(`[AUTH_SIGNIN_GOOGLE] Member ${memberRecord.id} found by google_provider_id ${googleProviderId}.`);
            if (memberRecord.email !== googleUserEmail || memberRecord.user_name !== googleUserName || memberRecord.image_url !== googleUserImage) {
              await sql`
                UPDATE members 
                SET email = ${googleUserEmail}, user_name = ${googleUserName}, image_url = ${googleUserImage} 
                WHERE id = ${memberRecord.id}`;
              logger.debug(`[AUTH_SIGNIN_GOOGLE] Updated details for member ${memberRecord.id}.`);
            }
            (user as any).id = memberRecord.id; 
            (user as any).name = googleUserName; 
            (user as any).email = googleUserEmail; 
            (user as any).image = googleUserImage; 
            return true;
          }
          memberResult = await sql`SELECT * FROM members WHERE email = ${googleUserEmail}`;
          memberRecord = memberResult.rows[0];
          if (memberRecord) {
            logger.debug(`[AUTH_SIGNIN_GOOGLE] Email ${googleUserEmail} exists for member ID ${memberRecord.id}. Linking Google ID ${googleProviderId}.`);
            await sql`
              UPDATE members 
              SET user_name = ${googleUserName}, image_url = ${googleUserImage}, google_provider_id = ${googleProviderId}
              WHERE id = ${memberRecord.id}`;
            logger.debug(`[AUTH_SIGNIN_GOOGLE] Linked Google account to existing member ${memberRecord.id}.`);
            (user as any).id = memberRecord.id;
            (user as any).name = googleUserName;
            (user as any).email = googleUserEmail;
            (user as any).image = googleUserImage;
            return true;
          }
          logger.debug(`[AUTH_SIGNIN_GOOGLE] New user. Email: ${googleUserEmail}. Creating new member with Google ID ${googleProviderId}.`);
          const newMemberId = uuidv4();
          const placeholderPassword = 'OAUTH_USER_NO_PASSWORD'; 
          await sql`
            INSERT INTO members (id, email, user_name, image_url, created_at, password, google_provider_id)
            VALUES (${newMemberId}, ${googleUserEmail}, ${googleUserName}, ${googleUserImage}, NOW(), ${placeholderPassword}, ${googleProviderId})`;
          logger.debug(`[AUTH_SIGNIN_GOOGLE] New member ${newMemberId} created for email ${googleUserEmail}.`);
          (user as any).id = newMemberId; 
          (user as any).name = googleUserName;
          (user as any).email = googleUserEmail;
          (user as any).image = googleUserImage;
          return true;
        } catch (error: any) {
          logger.error("[AUTH_SIGNIN_GOOGLE] Error processing Google sign-in:", error);
          if (error.message && error.message.includes("column") && error.message.includes("google_provider_id") && error.message.includes("does not exist")) {
             logger.error("[AUTH_SIGNIN_GOOGLE] DATABASE SCHEMA ERROR: The column 'google_provider_id' does not exist in the 'members' table. Please add it. SQL: ALTER TABLE members ADD COLUMN google_provider_id TEXT;");
          }
          return false; 
        }
      }
      return true; // Default to allow other sign-ins (e.g., credentials)
    },    async authorized({ auth, request }: { auth: NextAuthSession | null; request: NextRequest }): Promise<boolean | NextResponse> { 
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      logger.debug('[AUTH_CALLBACK] Path:', { metadata: { pathname: pathname, isLoggedIn: isLoggedIn, authPresent: !!auth } });
      if (auth?.user) { // Check if auth.user exists before stringifying
        logger.debug('[AUTH_CALLBACK] Auth user object present:', { metadata: { userPresent: !!auth.user, userDetails: JSON.stringify(auth.user) } });
      }

      const isOnDashboard = pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) {
          logger.debug('[AUTH_CALLBACK] User is logged in. Allowing access to dashboard.');
          return true;
        }
        logger.debug('[AUTH_CALLBACK] User is NOT logged in. Redirecting to /login from dashboard attempt.');
        return false; 
      } else if (isLoggedIn && pathname === '/login') {
        logger.debug('[AUTH_CALLBACK] User is logged in and on /login page. Redirecting to /dashboard.');
        return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
      }
      logger.debug('[AUTH_CALLBACK] Path not /dashboard or /login (or user not logged in on /login). Allowing.');
      return true;
    },
    async jwt({ token, user }: { token: JWT; user?: User | any }) { // user can be User or AdapterUser, using any for broader compatibility initially
      if (user) {
        token.id = (user as any).id;
        token.name = (user as any).name;
        token.email = (user as any).email;
        token.image = (user as any).image;
      }
      return token;
    },
    async session({ session, token }: { session: NextAuthSession; token: JWT }): Promise<NextAuthSession> { // Ensure session return type is correct
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).name = token.name as string;
        (session.user as any).email = token.email as string;
        (session.user as any).image = token.image as string | undefined;
      }
      return session;
    }
  },
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) { // req parameter is available but not used in this logic
        if (typeof credentials?.email !== 'string' || typeof credentials?.password !== 'string') {
          logger.debug("[AUTH_CREDENTIALS] Invalid credentials format");
          return null;
        }
        const email = credentials.email;
        const password = credentials.password;

        try {
          logger.debug(`[AUTH_CREDENTIALS] Attempting to authorize user: ${email}`);
          const result = await sql`SELECT * FROM members WHERE email = ${email}`;
          const member = result.rows[0];

          if (!member) {
            logger.debug(`[AUTH_CREDENTIALS] No member found with email: ${email}`);
            return null;
          }

          // Ensure member.password is a string before comparing
          if (typeof member.password !== 'string') {
            logger.error(`[AUTH_CREDENTIALS] Password for member ${email} is not a string.`);
            return null;
          }

          const isPasswordValid = await bcrypt.compare(password, member.password);
          if (!isPasswordValid) {
            logger.debug(`[AUTH_CREDENTIALS] Invalid password for email: ${email}`);
            return null;
          }

          logger.debug(`[AUTH_CREDENTIALS] User ${email} authorized successfully.`);
          // Ensure the returned object matches the expected User type from next-auth
          return {
            id: member.id as string,
            name: member.user_name as string | null, // Allow null if user_name can be null
            email: member.email as string,
            image: member.image_url as string | null, // Allow null if image_url can be null
          } as User; // Cast to User type

        } catch (error) {
          logger.error(`[AUTH_CREDENTIALS] Error during authorization for ${email}:`, error);
          return null;
        }
      }
    }),
    (() => { // IIFE to check env vars before initializing GoogleProvider
      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        logger.error("CRITICAL_AUTH_ERROR: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not set in environment variables. Google Sign-In will be disabled or may fail.");
        // Return a placeholder or skip GoogleProvider if critical env vars are missing
        // For now, we'll let it proceed and potentially fail if NextAuth handles it, 
        // or rely on the '!' assertions to throw if they are truly undefined.
        // A more robust solution might be to conditionally exclude GoogleProvider from the array.
      }
      return GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        allowDangerousEmailAccountLinking: true, // Recommended for email-based account linking
      });
    })(),
  ]
};

let authExports: any; 
try {
  logger.debug("AUTH.TS: Attempting to initialize NextAuth...");
  const initializedAuth = NextAuth(nextAuthConfig);
  
  if (!initializedAuth || typeof initializedAuth.handlers !== 'object' || typeof initializedAuth.auth !== 'function' || typeof initializedAuth.signIn !== 'function' || typeof initializedAuth.signOut !== 'function') {
    logger.error("CRITICAL_AUTH_ERROR: NextAuth initialization failed to return a valid object with expected exports (handlers, auth, signIn, signOut). Fallback will be used.");
    logger.error("CRITICAL_AUTH_ERROR: initializedAuth object was:", initializedAuth);
    throw new Error("NextAuth initialization did not produce the expected exports. Check logs for details, especially regarding provider configurations and environment variables.");
  }
  authExports = initializedAuth;
  logger.debug("AUTH.TS: NextAuth initialized successfully. Exported members (e.g., handlers) should be available.");
} catch (error) {
  logger.error("CRITICAL_AUTH_ERROR: An error occurred during NextAuth initialization process:", error);
  authExports = {
    handlers: {
      GET: () => { 
        logger.error("Fallback GET handler invoked due to NextAuth initialization failure."); 
        return new Response("Auth GET initialization failed. Check server logs.", { status: 500 }); 
      },
      POST: () => { 
        logger.error("Fallback POST handler invoked due to NextAuth initialization failure."); 
        return new Response("Auth POST initialization failed. Check server logs.", { status: 500 }); 
      },
    },
    auth: async () => { 
      logger.error("Fallback auth() invoked due to NextAuth initialization failure."); 
      return null; 
    },
    signIn: async () => { 
      logger.error("Fallback signIn() invoked due to NextAuth initialization failure."); 
      return { ok: false, error: "NextAuthInitError" } as any; 
    },
    signOut: async () => { 
      logger.error("Fallback signOut() invoked due to NextAuth initialization failure."); 
      throw new Error("NextAuth failed to initialize. Cannot sign out."); 
    },
  };
  // Re-throw the error to ensure the build process catches this as a critical failure.
  // This should provide a clearer point of failure in the build logs.
  throw new Error(`NextAuth initialization failed. Original error: ${error}. Check CRITICAL_AUTH_ERROR messages above.`);
}

export const { handlers, auth, signIn, signOut } = authExports;
