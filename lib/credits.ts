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

// Credits configuration
const CREDITS_CONFIG = {
  FREE_CREDITS_PER_USER: 1,
};

export async function getUserCredits(userId: string): Promise<number> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;

      return userData.availableCredits || 0;
    }

    return 0;
  } catch (error) {
    console.error('Error getting user credits:', error);

    return 0;
  }
}

/**
 * Get available free credits for a user
 */
export async function getUserFreeCredits(userId: string): Promise<number> {
  try {
    const userDoc = await getDoc(doc(db, COLLECTIONS.USERS, userId));

    if (!userDoc.exists()) return 0;

    const userData = userDoc.data() as User;
    const freeCreditsRemaining =
      CREDITS_CONFIG.FREE_CREDITS_PER_USER - (userData.freeCreditsUsed || 0);

    return Math.max(0, freeCreditsRemaining);
  } catch (error) {
    console.error('Error getting user free credits:', error);

    return 0;
  }
}

/**
 * Get total available credits (paid + free)
 */
export async function getTotalAvailableCredits(userId: string): Promise<{
  paidCredits: number;
  freeCredits: number;
  total: number;
}> {
  const [paidCredits, freeCredits] = await Promise.all([
    getUserCredits(userId),
    getUserFreeCredits(userId),
  ]);

  return {
    paidCredits,
    freeCredits,
    total: paidCredits + freeCredits,
  };
}

export async function deductCredits(
  userId: string,
  creditsToDeduct: number = 1
): Promise<{ success: boolean; usedFreeCredit: boolean }> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data() as User;
    const freeCreditsRemaining = Math.max(
      0,
      CREDITS_CONFIG.FREE_CREDITS_PER_USER - (userData.freeCreditsUsed || 0)
    );
    const totalAvailable =
      (userData.availableCredits || 0) + freeCreditsRemaining;

    if (totalAvailable < creditsToDeduct) {
      return { success: false, usedFreeCredit: false };
    }

    let usedFreeCredit = false;
    let remainingToDeduct = creditsToDeduct;

    // First, try to use free credits
    if (freeCreditsRemaining > 0 && remainingToDeduct > 0) {
      const freeCreditsToUse = Math.min(
        freeCreditsRemaining,
        remainingToDeduct
      );

      await updateDoc(userRef, {
        freeCreditsUsed: increment(freeCreditsToUse),
        updatedAt: new Date(),
      });

      remainingToDeduct -= freeCreditsToUse;
      usedFreeCredit = true;
    }

    // Then, use paid credits if needed
    if (remainingToDeduct > 0) {
      await updateDoc(userRef, {
        availableCredits: increment(-remainingToDeduct),
        updatedAt: new Date(),
      });

      // Update purchase records (deduct from most recent first)
      const purchasesQuery = query(
        collection(db, COLLECTIONS.PURCHASES),
        where('userId', '==', userId),
        where('creditsRemaining', '>', 0),
        where('status', '==', 'COMPLETED'),
        orderBy('createdAt', 'desc')
      );

      const purchasesSnapshot = await getDocs(purchasesQuery);
      let purchaseDeductRemaining = remainingToDeduct;

      for (const purchaseDoc of purchasesSnapshot.docs) {
        if (purchaseDeductRemaining <= 0) break;

        const purchaseData = purchaseDoc.data() as Purchase;
        const deductFromThisPurchase = Math.min(
          purchaseDeductRemaining,
          purchaseData.creditsRemaining
        );

        await updateDoc(doc(db, COLLECTIONS.PURCHASES, purchaseDoc.id), {
          creditsUsed: increment(deductFromThisPurchase),
          creditsRemaining: increment(-deductFromThisPurchase),
          updatedAt: new Date(),
        });

        purchaseDeductRemaining -= deductFromThisPurchase;
      }
    }

    return { success: true, usedFreeCredit };
  } catch (error) {
    console.error('Error deducting credits:', error);

    return { success: false, usedFreeCredit: false };
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
  usedFreeCredit = false,
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
  usedFreeCredit?: boolean;
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
      usedFreeCredit,
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
