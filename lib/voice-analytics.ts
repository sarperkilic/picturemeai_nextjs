import { adminDb } from '@/lib/firebase-admin';
import { VoiceTemplate } from '@/types/voices';

export interface VoiceUsageStats {
  voiceId: string;
  voiceName: string;
  totalUses: number;
  uniqueUsers: number;
  averageRating?: number;
  lastUsed: Date;
  category: string;
  gender: string;
}

export interface VoiceAnalytics {
  totalVoices: number;
  totalUsage: number;
  mostPopularVoices: VoiceUsageStats[];
  categoryDistribution: Record<string, number>;
  genderDistribution: Record<string, number>;
  recentActivity: VoiceUsageStats[];
  trendingVoices: VoiceUsageStats[];
}

export class VoiceAnalyticsService {
  // Track voice usage
  static async trackVoiceUsage(userId: string, voiceId: string, voiceName: string, category: string, gender: string) {
    try {
      const usageRef = adminDb.collection('voice_usage').doc();
      await usageRef.set({
        userId,
        voiceId,
        voiceName,
        category,
        gender,
        timestamp: new Date(),
        sessionId: `session_${Date.now()}`,
      });

      // Update voice stats
      const statsRef = adminDb.collection('voice_stats').doc(voiceId);
      const statsDoc = await statsRef.get();

      if (statsDoc.exists) {
        const stats = statsDoc.data()!;
        await statsRef.update({
          totalUses: stats.totalUses + 1,
          lastUsed: new Date(),
          uniqueUsers: stats.uniqueUsers.includes(userId) 
            ? stats.uniqueUsers 
            : [...stats.uniqueUsers, userId],
        });
      } else {
        await statsRef.set({
          voiceId,
          voiceName,
          category,
          gender,
          totalUses: 1,
          uniqueUsers: [userId],
          lastUsed: new Date(),
          createdAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error tracking voice usage:', error);
    }
  }

  // Get voice usage statistics
  static async getVoiceUsageStats(voiceId: string): Promise<VoiceUsageStats | null> {
    try {
      const statsDoc = await adminDb.collection('voice_stats').doc(voiceId).get();
      
      if (!statsDoc.exists) return null;

      const data = statsDoc.data()!;
      return {
        voiceId: data.voiceId,
        voiceName: data.voiceName,
        totalUses: data.totalUses || 0,
        uniqueUsers: Array.isArray(data.uniqueUsers) ? data.uniqueUsers.length : 0,
        averageRating: data.averageRating,
        lastUsed: data.lastUsed?.toDate(),
        category: data.category,
        gender: data.gender,
      };
    } catch (error) {
      console.error('Error getting voice usage stats:', error);
      return null;
    }
  }

  // Get comprehensive analytics
  static async getVoiceAnalytics(): Promise<VoiceAnalytics> {
    try {
      const statsSnapshot = await adminDb.collection('voice_stats').get();
      const stats: VoiceUsageStats[] = [];

      statsSnapshot.forEach(doc => {
        const data = doc.data();
        stats.push({
          voiceId: data.voiceId,
          voiceName: data.voiceName,
          totalUses: data.totalUses || 0,
          uniqueUsers: Array.isArray(data.uniqueUsers) ? data.uniqueUsers.length : 0,
          averageRating: data.averageRating,
          lastUsed: data.lastUsed?.toDate(),
          category: data.category,
          gender: data.gender,
        });
      });

      // Calculate analytics
      const totalVoices = stats.length;
      const totalUsage = stats.reduce((sum, stat) => sum + stat.totalUses, 0);

      // Most popular voices (by total uses)
      const mostPopularVoices = stats
        .sort((a, b) => b.totalUses - a.totalUses)
        .slice(0, 10);

      // Category distribution
      const categoryDistribution = stats.reduce((acc, stat) => {
        acc[stat.category] = (acc[stat.category] || 0) + stat.totalUses;
        return acc;
      }, {} as Record<string, number>);

      // Gender distribution
      const genderDistribution = stats.reduce((acc, stat) => {
        acc[stat.gender] = (acc[stat.gender] || 0) + stat.totalUses;
        return acc;
      }, {} as Record<string, number>);

      // Recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentActivity = stats
        .filter(stat => stat.lastUsed && stat.lastUsed > sevenDaysAgo)
        .sort((a, b) => b.lastUsed!.getTime() - a.lastUsed!.getTime())
        .slice(0, 10);

      // Trending voices (high usage in recent period)
      const trendingVoices = stats
        .filter(stat => stat.lastUsed && stat.lastUsed > sevenDaysAgo)
        .sort((a, b) => b.totalUses - a.totalUses)
        .slice(0, 5);

      return {
        totalVoices,
        totalUsage,
        mostPopularVoices,
        categoryDistribution,
        genderDistribution,
        recentActivity,
        trendingVoices,
      };
    } catch (error) {
      console.error('Error getting voice analytics:', error);
      return {
        totalVoices: 0,
        totalUsage: 0,
        mostPopularVoices: [],
        categoryDistribution: {},
        genderDistribution: {},
        recentActivity: [],
        trendingVoices: [],
      };
    }
  }

  // Get user-specific analytics
  static async getUserVoiceAnalytics(userId: string) {
    try {
      const usageSnapshot = await adminDb
        .collection('voice_usage')
        .where('userId', '==', userId)
        .orderBy('timestamp', 'desc')
        .get();

      const userUsage: any[] = [];
      usageSnapshot.forEach(doc => {
        const data = doc.data();
        userUsage.push({
          voiceId: data.voiceId,
          voiceName: data.voiceName,
          category: data.category,
          gender: data.gender,
          timestamp: data.timestamp?.toDate(),
        });
      });

      // Calculate user preferences
      const categoryCounts = userUsage.reduce((acc, usage) => {
        acc[usage.category] = (acc[usage.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const genderCounts = userUsage.reduce((acc, usage) => {
        acc[usage.gender] = (acc[usage.gender] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const favoriteVoice = userUsage.length > 0 
        ? userUsage.reduce((prev, current) => 
            (categoryCounts[current.voiceId] || 0) > (categoryCounts[prev.voiceId] || 0) ? current : prev
          )
        : null;

      return {
        totalUses: userUsage.length,
        favoriteCategory: Object.entries(categoryCounts)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || null,
        favoriteGender: Object.entries(genderCounts)
          .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] || null,
        favoriteVoice: favoriteVoice?.voiceName || null,
        recentUsage: userUsage.slice(0, 10),
        categoryBreakdown: categoryCounts,
        genderBreakdown: genderCounts,
      };
    } catch (error) {
      console.error('Error getting user voice analytics:', error);
      return {
        totalUses: 0,
        favoriteCategory: null,
        favoriteGender: null,
        favoriteVoice: null,
        recentUsage: [],
        categoryBreakdown: {},
        genderBreakdown: {},
      };
    }
  }

  // Update voice rating
  static async updateVoiceRating(voiceId: string, rating: number) {
    try {
      const statsRef = adminDb.collection('voice_stats').doc(voiceId);
      const statsDoc = await statsRef.get();

      if (statsDoc.exists) {
        const stats = statsDoc.data()!;
        const currentRating = stats.averageRating || 0;
        const totalRatings = stats.totalRatings || 0;
        
        const newTotalRatings = totalRatings + 1;
        const newAverageRating = ((currentRating * totalRatings) + rating) / newTotalRatings;

        await statsRef.update({
          averageRating: newAverageRating,
          totalRatings: newTotalRatings,
        });
      }
    } catch (error) {
      console.error('Error updating voice rating:', error);
    }
  }
} 