'use client';

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { useSession } from '@/lib/use-firebase-auth';
import { VoiceAnalyticsService, VoiceAnalytics } from '@/lib/voice-analytics';

interface VoiceAnalyticsDashboardProps {
  className?: string;
}

export function VoiceAnalyticsDashboard({ className = '' }: VoiceAnalyticsDashboardProps) {
  const { user } = useSession();
  const [analytics, setAnalytics] = useState<VoiceAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAnalytics();
    }
  }, [user?.id]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [globalAnalytics, userStats] = await Promise.all([
        VoiceAnalyticsService.getVoiceAnalytics(),
        VoiceAnalyticsService.getUserVoiceAnalytics(user!.id),
      ]);

      setAnalytics(globalAnalytics);
      setUserAnalytics(userStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardBody>
            <div className="animate-pulse">
              <div className="h-4 bg-default-200 rounded w-1/4 mb-4"></div>
              <div className="h-8 bg-default-200 rounded w-1/2"></div>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-danger mb-4">Error loading analytics: {error}</p>
              <Button color="primary" variant="flat" onPress={loadAnalytics}>
                Retry
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardBody>
            <div className="text-center py-8">
              <p className="text-default-500">No analytics data available</p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <h3 className="text-2xl font-bold text-primary">{analytics.totalVoices}</h3>
            <p className="text-sm text-default-500">Total Voices</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <h3 className="text-2xl font-bold text-success">{analytics.totalUsage}</h3>
            <p className="text-sm text-default-500">Total Usage</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <h3 className="text-2xl font-bold text-warning">{userAnalytics?.totalUses || 0}</h3>
            <p className="text-sm text-default-500">Your Usage</p>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <h3 className="text-2xl font-bold text-secondary">
              {userAnalytics?.favoriteVoice ? 'Yes' : 'No'}
            </h3>
            <p className="text-sm text-default-500">Favorite Voice</p>
          </CardBody>
        </Card>
      </div>

      {/* Popular Voices */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Most Popular Voices</h3>
        </CardHeader>
        <CardBody>
          {analytics.mostPopularVoices.length > 0 ? (
            <div className="space-y-3">
              {analytics.mostPopularVoices.slice(0, 5).map((voice, index) => (
                <div key={voice.voiceId} className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div>
                      <h4 className="font-medium">{voice.voiceName}</h4>
                      <p className="text-sm text-default-500">
                        {voice.category} • {voice.gender}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{voice.totalUses}</p>
                    <p className="text-xs text-default-500">uses</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-default-500 text-center py-4">No usage data available</p>
          )}
        </CardBody>
      </Card>

      {/* Category Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Category Distribution</h3>
          </CardHeader>
          <CardBody>
            {Object.keys(analytics.categoryDistribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.categoryDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="capitalize">{category}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-default-500 text-center py-4">No category data</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Gender Distribution</h3>
          </CardHeader>
          <CardBody>
            {Object.keys(analytics.genderDistribution).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(analytics.genderDistribution)
                  .sort(([, a], [, b]) => b - a)
                  .map(([gender, count]) => (
                    <div key={gender} className="flex items-center justify-between">
                      <span className="capitalize">{gender}</span>
                      <span className="font-semibold">{count}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-default-500 text-center py-4">No gender data</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* User Preferences */}
      {userAnalytics && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Your Voice Preferences</h3>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-default-50 rounded-lg">
                <h4 className="font-semibold text-primary">
                  {userAnalytics.favoriteCategory || 'None'}
                </h4>
                <p className="text-sm text-default-500">Favorite Category</p>
              </div>
              
              <div className="text-center p-4 bg-default-50 rounded-lg">
                <h4 className="font-semibold text-success">
                  {userAnalytics.favoriteGender || 'None'}
                </h4>
                <p className="text-sm text-default-500">Preferred Gender</p>
              </div>
              
              <div className="text-center p-4 bg-default-50 rounded-lg">
                <h4 className="font-semibold text-warning">
                  {userAnalytics.favoriteVoice || 'None'}
                </h4>
                <p className="text-sm text-default-500">Most Used Voice</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </CardHeader>
        <CardBody>
          {analytics.recentActivity.length > 0 ? (
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 5).map((voice) => (
                <div key={voice.voiceId} className="flex items-center justify-between p-3 bg-default-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{voice.voiceName}</h4>
                    <p className="text-sm text-default-500">
                      Last used: {voice.lastUsed.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{voice.totalUses}</p>
                    <p className="text-xs text-default-500">total uses</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-default-500 text-center py-4">No recent activity</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
} 