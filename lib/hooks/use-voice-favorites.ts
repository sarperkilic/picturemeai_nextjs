import { useState, useEffect } from 'react';
import { useSession } from '@/lib/use-firebase-auth';
import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { VoiceTemplate } from '@/types/voices';

interface VoiceFavorite {
  id: string;
  userId: string;
  voiceId: string;
  voiceName: string;
  addedAt: Date;
  lastUsed?: Date;
  useCount: number;
}

export function useVoiceFavorites() {
  const { user } = useSession();
  const [favorites, setFavorites] = useState<VoiceFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's favorite voices
  const loadFavorites = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const favoritesQuery = query(
        collection(db, 'user_voice_favorites'),
        where('userId', '==', user.id)
      );
      
      const querySnapshot = await getDocs(favoritesQuery);
      const favoritesData: VoiceFavorite[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        favoritesData.push({
          id: doc.id,
          ...data,
          addedAt: data.addedAt?.toDate(),
          lastUsed: data.lastUsed?.toDate(),
        } as VoiceFavorite);
      });

      // Sort by last used (most recent first)
      favoritesData.sort((a, b) => {
        if (!a.lastUsed && !b.lastUsed) return b.addedAt.getTime() - a.addedAt.getTime();
        if (!a.lastUsed) return 1;
        if (!b.lastUsed) return -1;
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      });

      setFavorites(favoritesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  // Add voice to favorites
  const addToFavorites = async (voice: VoiceTemplate) => {
    if (!user?.id) return;

    try {
      const favoriteRef = doc(collection(db, 'user_voice_favorites'));
      const favoriteData: Omit<VoiceFavorite, 'id'> = {
        userId: user.id,
        voiceId: voice.voice_id,
        voiceName: voice.name,
        addedAt: new Date(),
        useCount: 0,
      };

      await setDoc(favoriteRef, favoriteData);
      
      // Update local state
      setFavorites(prev => [{
        id: favoriteRef.id,
        ...favoriteData,
      }, ...prev]);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to favorites');
      return false;
    }
  };

  // Remove voice from favorites
  const removeFromFavorites = async (voiceId: string) => {
    if (!user?.id) return;

    try {
      const favoriteToRemove = favorites.find(fav => fav.voiceId === voiceId);
      if (!favoriteToRemove) return false;

      await deleteDoc(doc(db, 'user_voice_favorites', favoriteToRemove.id));
      
      // Update local state
      setFavorites(prev => prev.filter(fav => fav.voiceId !== voiceId));

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove from favorites');
      return false;
    }
  };

  // Update voice usage count
  const updateVoiceUsage = async (voiceId: string) => {
    if (!user?.id) return;

    try {
      const favoriteToUpdate = favorites.find(fav => fav.voiceId === voiceId);
      if (!favoriteToUpdate) return;

      const favoriteRef = doc(db, 'user_voice_favorites', favoriteToUpdate.id);
      await setDoc(favoriteRef, {
        ...favoriteToUpdate,
        lastUsed: new Date(),
        useCount: favoriteToUpdate.useCount + 1,
      }, { merge: true });

      // Update local state
      setFavorites(prev => prev.map(fav => 
        fav.voiceId === voiceId 
          ? { ...fav, lastUsed: new Date(), useCount: fav.useCount + 1 }
          : fav
      ));
    } catch (err) {
      console.error('Failed to update voice usage:', err);
    }
  };

  // Check if voice is in favorites
  const isFavorite = (voiceId: string) => {
    return favorites.some(fav => fav.voiceId === voiceId);
  };

  // Get favorite by voice ID
  const getFavorite = (voiceId: string) => {
    return favorites.find(fav => fav.voiceId === voiceId);
  };

  // Load favorites on mount and when user changes
  useEffect(() => {
    loadFavorites();
  }, [user?.id]);

  return {
    favorites,
    isLoading,
    error,
    addToFavorites,
    removeFromFavorites,
    updateVoiceUsage,
    isFavorite,
    getFavorite,
    refreshFavorites: loadFavorites,
  };
} 