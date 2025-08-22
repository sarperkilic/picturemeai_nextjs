import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

import { User } from '@/types/firebase';
import { COLLECTIONS } from '@/types/firebase';

import { auth, db } from './firebase';

// Upsert user function as per db_todos.md
export async function upsertUser(uid: string, email: string, name: string) {
  const ref = doc(db, COLLECTIONS.USERS, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      tier: "free",
      credits: 50,
      email,
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }); // create
  } else {
    await updateDoc(ref, {
      email,
      name,
      updatedAt: serverTimestamp(),
    }); // update
  }
}

// Firebase Auth Client
export class FirebaseAuthClient {
  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create user document in Firestore using upsertUser
      await upsertUser(user.uid, email, name);

      // Send email verification
      await sendEmailVerification(user);

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Sign in with Google
  static async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Create or update user document using upsertUser
      await upsertUser(user.uid, user.email || '', user.displayName || 'User');

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Sign out
  static async signOut() {
    try {
      await signOut(auth);
    } catch (error) {
      throw error;
    }
  }

  // Send password reset email
  static async sendPasswordReset(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      throw error;
    }
  }

  // Send email verification
  static async sendEmailVerification() {
    try {
      const user = auth.currentUser;

      if (user) {
        await sendEmailVerification(user);
      }
    } catch (error) {
      throw error;
    }
  }

  // Get current user
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Get current user's ID token for API requests
  static async getIdToken(): Promise<string | null> {
    try {
      const user = auth.currentUser;

      if (user) {
        return await user.getIdToken();
      }

      return null;
    } catch (error) {
      console.error('Error getting ID token:', error);

      return null;
    }
  }

  // Make authenticated API request
  static async authenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getIdToken();

    if (!token) {
      throw new Error('No authentication token available');
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    };

    return fetch(url, {
      ...options,
      headers,
    });
  }

  // Listen to auth state changes
  static onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  // Update user profile
  static async updateUserProfile(uid: string, data: Partial<User>) {
    try {
      const userRef = doc(db, COLLECTIONS.USERS, uid);

      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date(),
      });
    } catch (error) {
      throw error;
    }
  }

  // Get user data from Firestore
  static async getUserData(uid: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, uid));

      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }
}
