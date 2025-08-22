'use client';

import { create } from 'zustand';

import { FirebaseAuthClient } from './firebase-auth';

interface CreditInfo {
  credits: number;
}

interface CreditsStore {
  creditInfo: CreditInfo | null;
  setCreditInfo: (creditInfo: CreditInfo) => void;
  decrementCredits: (amount?: number) => void;
  incrementCredits: (amount: number) => void;
  fetchCredits: () => Promise<void>;
}

export const useCreditsStore = create<CreditsStore>(set => ({
  creditInfo: null,

  setCreditInfo: (creditInfo: CreditInfo) => set({ creditInfo }),

  decrementCredits: (amount = 1) =>
    set(state => {
      if (state.creditInfo === null) {
        return {};
      }

      const newCredits = Math.max(0, state.creditInfo.credits - amount);

      return {
        creditInfo: {
          credits: newCredits,
        },
      };
    }),

  incrementCredits: (amount: number) =>
    set(state => {
      if (state.creditInfo === null) {
        return {
          creditInfo: {
            credits: amount,
          },
        };
      }

      return {
        creditInfo: {
          credits: state.creditInfo.credits + amount,
        },
      };
    }),

  fetchCredits: async () => {
    try {
      console.log('fetchCredits: Starting...');
      const currentUser = FirebaseAuthClient.getCurrentUser();
      
      if (!currentUser) {
        console.error('fetchCredits: No authenticated user found');
        return;
      }

      console.log('fetchCredits: User found:', currentUser.uid);

      // Fetch credits directly from Firestore
      const { getUserCredits } = await import('./credits');
      const credits = await getUserCredits(currentUser.uid);

      console.log('fetchCredits: Credits fetched:', credits);

      set({
        creditInfo: {
          credits: credits,
        },
      });
      
      console.log('fetchCredits: State updated with credits:', credits);
    } catch (error) {
      console.error('fetchCredits: Error fetching credits:', error);
    }
  },
}));
