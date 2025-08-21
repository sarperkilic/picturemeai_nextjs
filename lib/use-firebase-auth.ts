import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';

import { User } from '@/types/firebase';

import { FirebaseAuthClient } from './firebase-auth';

export interface Session {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export function useSession(): Session {
  const [session, setSession] = useState<Session>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const unsubscribe = FirebaseAuthClient.onAuthStateChange(
      async (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
          try {
            // Get user data from Firestore
            const userData = await FirebaseAuthClient.getUserData(
              firebaseUser.uid
            );

            setSession({
              user: userData,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            setSession({
              user: null,
              isLoading: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to load user data',
            });
          }
        } else {
          setSession({
            user: null,
            isLoading: false,
            error: null,
          });
        }
      }
    );

    return () => unsubscribe();
  }, []);

  return session;
}

export function useAuth() {
  const session = useSession();

  const signIn = async (email: string, password: string) => {
    try {
      await FirebaseAuthClient.signIn(email, password);
    } catch (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      await FirebaseAuthClient.signUp(email, password, name);
    } catch (error) {
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await FirebaseAuthClient.signInWithGoogle();
    } catch (error) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await FirebaseAuthClient.signOut();
    } catch (error) {
      throw error;
    }
  };

  const sendPasswordReset = async (email: string) => {
    try {
      await FirebaseAuthClient.sendPasswordReset(email);
    } catch (error) {
      throw error;
    }
  };

  const sendEmailVerification = async () => {
    try {
      await FirebaseAuthClient.sendEmailVerification();
    } catch (error) {
      throw error;
    }
  };

  return {
    ...session,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    sendPasswordReset,
    sendEmailVerification,
  };
}
