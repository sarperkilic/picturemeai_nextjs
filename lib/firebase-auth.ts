import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { User } from '@/types/firebase';
import { COLLECTIONS } from '@/types/firebase';

// Firebase Auth Client
export class FirebaseAuthClient {
  // Sign in with email and password
  static async signIn(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  }

  // Sign up with email and password
  static async signUp(email: string, password: string, name: string) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      const userData: Omit<User, 'id'> = {
        name,
        email,
        emailVerified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        availableCredits: 1, // Free credit for new users
        freeCreditsUsed: 0,
      };

      await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData);

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

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, user.uid));
      
      if (!userDoc.exists()) {
        const userData: Omit<User, 'id'> = {
          name: user.displayName || 'User',
          email: user.email || '',
          emailVerified: user.emailVerified,
          image: user.photoURL || undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
          availableCredits: 1, // Free credit for new users
          freeCreditsUsed: 0,
        };

        await setDoc(doc(db, COLLECTIONS.USERS, user.uid), userData);
      }

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