import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { COLLECTIONS } from '@/types/firebase';
import { readFileSync } from 'fs';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  // Try to use service account key file first, fallback to environment variables
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/sarperkilic/Downloads/service-account-key.json';
  
  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ugc-video-generator-e929d.firebasestorage.app',
    });
    
    console.log('✅ Using service account key file for authentication');
  } catch (error) {
    console.log('⚠️  Service account file not found, trying environment variables...');
    
    // Fallback to environment variables
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ugc-video-generator-e929d.firebasestorage.app',
    });
    
    console.log('✅ Using environment variables for authentication');
  }
}

// Initialize Firebase Admin services
export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const adminStorage = getStorage();

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

export default getApps()[0];
