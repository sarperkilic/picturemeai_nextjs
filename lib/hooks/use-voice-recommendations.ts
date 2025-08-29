import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSession } from '@/lib/use-firebase-auth';
import { useVoiceFavorites } from './use-voice-favorites';
import { useVoices } from './use-voices';
import { VoiceTemplate } from '@/types/voices';

interface VoiceRecommendation {
  voice: VoiceTemplate;
  score: number;
  reason: string;
}

export function useVoiceRecommendations() {
  const { user } = useSession();
  const { favorites, updateVoiceUsage } = useVoiceFavorites();
  const { allVoices: voices } = useVoices();
  const [recommendations, setRecommendations] = useState<VoiceRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Analyze user preferences based on favorites and usage
  const analyzeUserPreferences = useCallback(() => {
    const preferences = {
      preferredGender: '',
      preferredCategory: '',
      preferredLanguage: '',
    };

    if (favorites.length === 0) return preferences;

    // Analyze gender preferences
    const genderCounts = favorites.reduce((acc, fav) => {
      const voice = voices.find(v => v.voice_id === fav.voiceId);
      if (voice) {
        acc[voice.gender] = (acc[voice.gender] || 0) + fav.useCount;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(genderCounts).length > 0) {
      preferences.preferredGender = Object.entries(genderCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0][0];
    }

    // Analyze category preferences
    const categoryCounts = favorites.reduce((acc, fav) => {
      const voice = voices.find(v => v.voice_id === fav.voiceId);
      if (voice) {
        acc[voice.category] = (acc[voice.category] || 0) + fav.useCount;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(categoryCounts).length > 0) {
      preferences.preferredCategory = Object.entries(categoryCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0][0];
    }

    // Analyze language preferences
    const languageCounts = favorites.reduce((acc, fav) => {
      const voice = voices.find(v => v.voice_id === fav.voiceId);
      if (voice) {
        acc[voice.language] = (acc[voice.language] || 0) + fav.useCount;
      }
      return acc;
    }, {} as Record<string, number>);

    if (Object.keys(languageCounts).length > 0) {
      preferences.preferredLanguage = Object.entries(languageCounts)
        .sort(([, a], [, b]) => (b as number) - (a as number))[0][0];
    }

    return preferences;
  }, [favorites, voices]);

  // Check if voice was added recently (within last 30 days)
  const isRecentVoice = useCallback((createdAt: Date) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return createdAt > thirtyDaysAgo;
  }, []);

  // Generate recommendations based on user preferences
  const generateRecommendations = useMemo(() => {
    if (!voices.length || !user?.id) return [];

    const recommendations: VoiceRecommendation[] = [];
    const userPreferences = analyzeUserPreferences();

    voices.forEach(voice => {
      let score = 0;
      const reasons: string[] = [];

      // Skip if already in favorites
      if (favorites.some(fav => fav.voiceId === voice.voice_id)) {
        return;
      }

      // Score based on user's preferred gender
      if (userPreferences.preferredGender && voice.gender === userPreferences.preferredGender) {
        score += 3;
        reasons.push(`Matches your preferred ${voice.gender} voice`);
      }

      // Score based on user's preferred category
      if (userPreferences.preferredCategory && voice.category === userPreferences.preferredCategory) {
        score += 2;
        reasons.push(`Matches your preferred ${voice.category} category`);
      }

      // Score based on voice popularity (if we had analytics)
      if (voice.labels?.popularity === 'high') {
        score += 1;
        reasons.push('Popular choice among users');
      }

      // Score based on voice quality indicators
      if (voice.settings?.stability > 0.7) {
        score += 1;
        reasons.push('High stability voice');
      }

      // Score based on recent additions
      if (voice.created_at && isRecentVoice(voice.created_at)) {
        score += 1;
        reasons.push('Recently added voice');
      }

      // Score based on language preference
      if (userPreferences.preferredLanguage && voice.language === userPreferences.preferredLanguage) {
        score += 2;
        reasons.push(`Matches your preferred language (${voice.language})`);
      }

      // Only include voices with a minimum score
      if (score > 0) {
        recommendations.push({
          voice,
          score,
          reason: reasons.join(', '),
        });
      }
    });

    // Sort by score (highest first) and limit to top 10
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [voices, favorites, user?.id, analyzeUserPreferences, isRecentVoice]);

  // Get trending voices (voices with high usage in favorites)
  const getTrendingVoices = useMemo(() => {
    if (favorites.length === 0) return [];

    const trendingVoices = favorites
      .filter(fav => fav.useCount > 0)
      .sort((a, b) => b.useCount - a.useCount)
      .slice(0, 5)
      .map(fav => {
        const voice = voices.find(v => v.voice_id === fav.voiceId);
        return voice;
      })
      .filter(Boolean) as VoiceTemplate[];

    return trendingVoices;
  }, [favorites, voices]);

  // Get recently used voices
  const getRecentlyUsedVoices = useMemo(() => {
    if (favorites.length === 0) return [];

    const recentlyUsed = favorites
      .filter(fav => fav.lastUsed)
      .sort((a, b) => {
        if (!a.lastUsed || !b.lastUsed) return 0;
        return b.lastUsed.getTime() - a.lastUsed.getTime();
      })
      .slice(0, 5)
      .map(fav => {
        const voice = voices.find(v => v.voice_id === fav.voiceId);
        return voice;
      })
      .filter(Boolean) as VoiceTemplate[];

    return recentlyUsed;
  }, [favorites, voices]);

  // Update recommendations when dependencies change
  useEffect(() => {
    setIsLoading(true);
    setRecommendations(generateRecommendations);
    setIsLoading(false);
  }, [generateRecommendations]);

  return {
    recommendations,
    trendingVoices: getTrendingVoices,
    recentlyUsedVoices: getRecentlyUsedVoices,
    isLoading,
    updateVoiceUsage,
  };
} 