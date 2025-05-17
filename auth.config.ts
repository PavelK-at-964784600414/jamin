// Define our own type structure for Auth to avoid import issues
type AuthSession = {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
};

type AuthorizedCallback = {
  auth: AuthSession | null;
  request: { nextUrl: URL };
};

// Define the structure for our auth config without relying on the imported type
export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: AuthorizedCallback) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }
      return true;
    },
  },
  providers: [], // Add providers with an empty array for now
};