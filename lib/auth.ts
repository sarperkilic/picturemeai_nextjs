import { NextRequest } from 'next/server';
import { headers } from 'next/headers';
import { FirebaseAuthClient } from './firebase-auth';
import { adminAuth } from './firebase-admin';
import { User } from '@/types/firebase';

// Server-side session interface
export interface ServerSession {
  user: User;
  token: string;
}

// Client-side session interface
export interface ClientSession {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Unified auth interface
export const auth = {
  // Client-side methods
  client: {
    // Get current session (for client components)
    getSession: (): ClientSession => {
      // This will be used by client components
      // The actual implementation is in use-firebase-auth.ts
      throw new Error('Use useAuth() hook in client components');
    },

    // Sign in with email and password
    signIn: async (email: string, password: string) => {
      return FirebaseAuthClient.signIn(email, password);
    },

    // Sign up with email and password
    signUp: async (email: string, password: string, name: string) => {
      return FirebaseAuthClient.signUp(email, password, name);
    },

    // Sign in with Google
    signInWithGoogle: async () => {
      return FirebaseAuthClient.signInWithGoogle();
    },

    // Sign out
    signOut: async () => {
      return FirebaseAuthClient.signOut();
    },

    // Send password reset email
    sendPasswordReset: async (email: string) => {
      return FirebaseAuthClient.sendPasswordReset(email);
    },

    // Send email verification
    sendEmailVerification: async () => {
      return FirebaseAuthClient.sendEmailVerification();
    },

    // Get current user
    getCurrentUser: () => {
      return FirebaseAuthClient.getCurrentUser();
    },

    // Listen to auth state changes
    onAuthStateChange: (callback: (user: any) => void) => {
      return FirebaseAuthClient.onAuthStateChange(callback);
    },

    // Update user profile
    updateUserProfile: async (uid: string, data: Partial<User>) => {
      return FirebaseAuthClient.updateUserProfile(uid, data);
    },

    // Get user data from Firestore
    getUserData: async (uid: string): Promise<User | null> => {
      return FirebaseAuthClient.getUserData(uid);
    },
  },

  // Server-side methods
  api: {
    // Get session from request headers (for API routes)
    getSession: async ({ headers: requestHeaders }: { headers: Promise<Headers> | Headers | (() => Promise<Headers> | Headers) }): Promise<ServerSession | null> => {
      try {
        let headersList: Headers;
        if (typeof requestHeaders === 'function') {
          headersList = await requestHeaders();
        } else if (requestHeaders instanceof Promise) {
          headersList = await requestHeaders;
        } else {
          headersList = requestHeaders;
        }
        const authorization = headersList.get('authorization');

        if (!authorization || !authorization.startsWith('Bearer ')) {
          return null;
        }

        const token = authorization.substring(7);
        
        // Verify the token with Firebase Admin
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        if (!decodedToken.uid) {
          return null;
        }

        // Get user data from Firestore
        const userData = await FirebaseAuthClient.getUserData(decodedToken.uid);
        
        if (!userData) {
          return null;
        }

        return {
          user: userData,
          token,
        };
      } catch (error) {
        console.error('Error verifying session:', error);
        return null;
      }
    },

    // Get session from NextRequest (alternative method)
    getSessionFromRequest: async (request: NextRequest): Promise<ServerSession | null> => {
      try {
        const authorization = request.headers.get('authorization');

        if (!authorization || !authorization.startsWith('Bearer ')) {
          return null;
        }

        const token = authorization.substring(7);
        
        // Verify the token with Firebase Admin
        const decodedToken = await adminAuth.verifyIdToken(token);
        
        if (!decodedToken.uid) {
          return null;
        }

        // Get user data from Firestore
        const userData = await FirebaseAuthClient.getUserData(decodedToken.uid);
        
        if (!userData) {
          return null;
        }

        return {
          user: userData,
          token,
        };
      } catch (error) {
        console.error('Error verifying session:', error);
        return null;
      }
    },
  },
};

// Export the auth object as default
export default auth; 