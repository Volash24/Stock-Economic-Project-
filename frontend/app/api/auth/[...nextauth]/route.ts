import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

// --- TEMPORARY LOG - REMOVED ---
// console.log('[AUTH DEBUG] NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? 'SET' : 'MISSING or EMPTY');
// -------------------------------

// Define AuthOptions object
export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      console.log("[Auth Callback] JWT Start:", JSON.stringify({ token, user }, null, 2));
      if (user) {
        token.id = user.id;
        console.log("[Auth Callback] JWT: Added user.id to token:", token.id);
      }
      console.log("[Auth Callback] JWT End:", JSON.stringify(token, null, 2));
      return token;
    },
    async session({ session, token }) {
      console.log("[Auth Callback] Session Start:", JSON.stringify({ session, token }, null, 2));
      if (token?.id && session.user) {
        session.user.id = token.id as string;
        console.log("[Auth Callback] Session: Added token.id to session.user.id:", session.user.id);
      } else {
        console.log("[Auth Callback] Session: Condition failed (token.id or session.user missing)");
        console.log("[Auth Callback] Session: token.id:", token?.id);
        console.log("[Auth Callback] Session: session.user exists:", !!session.user);
      }
      console.log("[Auth Callback] Session End:", JSON.stringify(session, null, 2));
      return session;
    },
  },
  // Ensure NEXTAUTH_SECRET is implicitly used or explicitly set here if needed
  // secret: process.env.NEXTAUTH_SECRET, // Add if necessary, usually handled by env var
  debug: process.env.NODE_ENV === 'development',
};

// Use the defined authOptions object
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };