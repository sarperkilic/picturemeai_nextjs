import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

import { User, Generation, Purchase, COLLECTIONS } from '@/types/firebase';

import { db } from './firebase';

export async function getUserCredits(userId: string): Promise<number> {
  try {
    console.log('getUserCredits: Fetching for user:', userId);
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      console.log('getUserCredits: User data:', userData);
      console.log('getUserCredits: Credits from data:', userData.credits);

      return userData.credits || 0;
    }

    console.log('getUserCredits: User document does not exist');
    return 0;
  } catch (error) {
    console.error('getUserCredits: Error getting user credits:', error);

    return 0;
  }
}



/**
 * Get total available credits (paid + free)
 */
export async function getTotalAvailableCredits(userId: string): Promise<{
  credits: number;
}> {
  const credits = await getUserCredits(userId);

  return {
    credits,
  };
}

export async function deductCredits(
  userId: string,
  creditsToDeduct: number = 1
): Promise<{ success: boolean }> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    const availableCredits = userData.credits || 0;

    if (availableCredits < creditsToDeduct) {
      return { success: false };
    }

    // Deduct credits
    await updateDoc(userRef, {
      credits: increment(-creditsToDeduct),
      updatedAt: new Date(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error deducting credits:', error);

    return { success: false };
  }
}

export async function recordGeneration({
  userId,
  prompt,
  category,
  numImages,
  imageUrls,
  imageSize,
  style,
  renderingSpeed,
  falRequestId,
  creditsUsed = 1,
}: {
  userId: string;
  prompt: string;
  category: string;
  numImages: number;
  imageUrls: string[];
  imageSize: string;
  style: string;
  renderingSpeed: string;
  falRequestId?: string;
  creditsUsed?: number;
}) {
  try {
    const generationData: Omit<Generation, 'id'> = {
      userId,
      prompt,
      category,
      numImages,
      imageUrls,
      imageSize,
      style,
      renderingSpeed,
      falRequestId,
      creditsUsed,
      createdAt: new Date(),
    };

    const docRef = await addDoc(
      collection(db, COLLECTIONS.GENERATIONS),
      generationData
    );

    return {
      id: docRef.id,
      ...generationData,
    };
  } catch (error) {
    console.error('Error recording generation:', error);
    throw error;
  }
}

export async function getUserGenerations(
  userId: string,
  limitCount: number = 50
) {
  try {
    const generationsQuery = query(
      collection(db, COLLECTIONS.GENERATIONS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const snapshot = await getDocs(generationsQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Generation[];
  } catch (error) {
    console.error('Error getting user generations:', error);

    return [];
  }
}

export async function getUserPurchases(userId: string) {
  try {
    const purchasesQuery = query(
      collection(db, COLLECTIONS.PURCHASES),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(purchasesQuery);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Purchase[];
  } catch (error) {
    console.error('Error getting user purchases:', error);

    return [];
  }
}
