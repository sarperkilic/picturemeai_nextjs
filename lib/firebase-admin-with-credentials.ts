import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/types/firebase';

// Configuration that can use either environment variables or service account file
const getFirebaseAdminConfig = () => {
  // If GOOGLE_APPLICATION_CREDENTIALS is set, use service account file
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.log('Using Google Application Credentials from file');
    return {};
  }
  
  // Otherwise, use environment variables
  console.log('Using Firebase Admin credentials from environment variables');
  return {
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  };
};

// Initialize Firebase Admin
const app =
  getApps().length === 0 ? initializeApp(getFirebaseAdminConfig()) : getApps()[0];

// Initialize Firebase Admin services
export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app);

// Collection-group query for analytics
export async function getFailedRendersLast24h() {
  try {
    const rendersRef = adminDb.collectionGroup(COLLECTIONS.RENDERS);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const query = rendersRef
      .where('status', '==', 'failed')
      .where('createdAt', '>=', twentyFourHoursAgo)
      .orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting failed renders:', error);
    return [];
  }
}

export async function getRendersByProvider(provider: string) {
  try {
    const rendersRef = adminDb.collectionGroup(COLLECTIONS.RENDERS);
    const query = rendersRef
      .where('model', '==', provider)
      .orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    return snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting renders by provider:', error);
    return [];
  }
}

export default app; 