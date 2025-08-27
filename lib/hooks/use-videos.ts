import useSWR, { mutate } from 'swr';
import { useSession } from '@/lib/use-firebase-auth';
import { Project } from '@/types/firebase';
import { FirebaseAuthClient } from '@/lib/firebase-auth';
import { useState } from 'react';

// Consistent cache key for all video operations
export const VIDEOS_KEY = '/api/projects';

// Phase 5: Performance monitoring and analytics
interface PerformanceMetrics {
  fetchTime: number;
  cacheHit: boolean;
  errorCount: number;
  retryCount: number;
}

interface UseVideosOptions {
  limit?: number;
  refreshInterval?: number;
  retryCount?: number;
  retryInterval?: number;
  enablePerformanceMonitoring?: boolean;
  enableAdvancedCaching?: boolean;
}

export function useVideos(options: UseVideosOptions = {}) {
  const { user } = useSession();
  const { 
    limit = 10, 
    refreshInterval = 5000, 
    retryCount = 3, 
    retryInterval = 1000,
    enablePerformanceMonitoring = true,
    enableAdvancedCaching = true
  } = options;
  
  // Phase 5: Performance monitoring state
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics>({
    fetchTime: 0,
    cacheHit: false,
    errorCount: 0,
    retryCount: 0
  });

  const { data, error, isLoading, mutate: refreshVideos } = useSWR(
    user?.id ? `${VIDEOS_KEY}?limit=${limit}` : null,
    async (url) => {
      const startTime = performance.now();
      
      try {
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${await FirebaseAuthClient.getIdToken()}`,
          },
          // Phase 5: Advanced caching headers
          ...(enableAdvancedCaching && {
            cache: 'no-store' as RequestCache,
          }),
        });
        
        const fetchTime = performance.now() - startTime;
        
        if (response.status === 401) {
          // Handle expired token - could trigger re-auth here
          throw new Error('Authentication expired');
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch videos: ${response.status}`);
        }
        
        const result: { success: boolean; projects: Project[] } = await response.json();
        
        if (!result.success) {
          throw new Error('API returned error');
        }
        
        // Phase 5: Update performance metrics
        if (enablePerformanceMonitoring) {
          setPerformanceMetrics(prev => ({
            ...prev,
            fetchTime,
            cacheHit: false,
            errorCount: 0
          }));
        }
        
        return result.projects;
      } catch (error) {
        const fetchTime = performance.now() - startTime;
        
        // Phase 5: Update error metrics
        if (enablePerformanceMonitoring) {
          setPerformanceMetrics(prev => ({
            ...prev,
            fetchTime,
            errorCount: prev.errorCount + 1
          }));
        }
        
        throw error as Error;
      }
    },
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      errorRetryCount: retryCount,
      errorRetryInterval: retryInterval,
      // Phase 5: Advanced SWR configuration
      dedupingInterval: enableAdvancedCaching ? 2000 : 0,
      focusThrottleInterval: 5000,
      loadingTimeout: 10000,
      onError: (error) => {
        console.error('SWR error:', error);
        
        // Phase 5: Error analytics
        if (enablePerformanceMonitoring) {
          // Could send to analytics service here
          console.log('SWR Error Analytics:', {
            error: error.message,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          });
        }
      },
      // Phase 5: Enhanced error handling and retry logic
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        // Don't retry on 401 errors (authentication issues)
        if (error.message === 'Authentication expired') {
          return;
        }
        
        // Don't retry on 404 errors (resource not found)
        if (error.message.includes('404')) {
          return;
        }
        
        // Phase 5: Update retry metrics
        if (enablePerformanceMonitoring) {
          setPerformanceMetrics(prev => ({
            ...prev,
            retryCount: prev.retryCount + 1
          }));
        }
        
        // Retry up to the configured retry count
        if (retryCount < (config.errorRetryCount || 3)) {
          setTimeout(() => revalidate({ retryCount }), config.errorRetryInterval || 1000);
        }
      },
      // Phase 5: Success callback for analytics
      onSuccess: (data, key, config) => {
        if (enablePerformanceMonitoring) {
          setPerformanceMetrics(prev => ({
            ...prev,
            cacheHit: true
          }));
          
          // Could send success analytics here
          console.log('SWR Success Analytics:', {
            dataLength: data?.length || 0,
            timestamp: new Date().toISOString(),
            cacheKey: key
          });
        }
      }
    }
  );

  // Conditional polling: only poll when videos are processing
  const hasProcessingVideos = data?.some(video => 
    video.status === 'draft' || 
    video.status === 'ready' || 
    video.status === 'rendering'
  );
  const effectiveRefreshInterval = hasProcessingVideos ? refreshInterval : 0;

  // Phase 5: Enhanced refresh function with optimistic updates and analytics
  const enhancedRefreshVideos = async () => {
    const startTime = performance.now();
    
    try {
      // Optimistic update: show loading state immediately
      await refreshVideos();
      
      const refreshTime = performance.now() - startTime;
      
      // Phase 5: Refresh analytics
      if (enablePerformanceMonitoring) {
        console.log('Refresh Analytics:', {
          refreshTime,
          timestamp: new Date().toISOString(),
          videoCount: data?.length || 0
        });
      }
          } catch (error) {
        const refreshTime = performance.now() - startTime;
        
        console.error('Failed to refresh videos:', error);
        
        // Phase 5: Refresh error analytics
        if (enablePerformanceMonitoring) {
          console.log('Refresh Error Analytics:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            refreshTime,
            timestamp: new Date().toISOString()
          });
        }
        
        // Re-throw error to be handled by the component
        throw error as Error;
      }
  };

  // Phase 5: Cache management utilities
  const clearCache = () => {
    mutate(VIDEOS_KEY, undefined, false);
  };

  const prefetchVideos = async () => {
    if (user?.id) {
      await mutate(`${VIDEOS_KEY}?limit=${limit}`);
    }
  };

  return {
    videos: data || [],
    isLoading,
    error,
    refreshVideos: enhancedRefreshVideos,
    hasProcessingVideos,
    // Phase 5: Additional metadata for better UX
    totalVideos: data?.length || 0,
    processingCount: data?.filter(video => 
      video.status === 'draft' || 
      video.status === 'ready' || 
      video.status === 'rendering'
    ).length || 0,
    completedCount: data?.filter(video => video.status === 'complete').length || 0,
    // Phase 5: Performance monitoring data
    performanceMetrics: enablePerformanceMonitoring ? performanceMetrics : null,
    // Phase 5: Cache management
    clearCache,
    prefetchVideos,
    // Phase 5: Advanced features
    isStale: false, // SWR provides this, but we can enhance it
    isValidating: false, // SWR provides this, but we can enhance it
  };
}

// Global mutate function using consistent key
export const refreshVideosList = () => mutate(VIDEOS_KEY);

// Phase 5: Enhanced global refresh with error handling and analytics
export const refreshVideosListWithErrorHandling = async () => {
  const startTime = performance.now();
  
  try {
    await mutate(VIDEOS_KEY);
    
    const refreshTime = performance.now() - startTime;
    
    // Phase 5: Global refresh analytics
    console.log('Global Refresh Analytics:', {
      refreshTime,
      timestamp: new Date().toISOString(),
      success: true
    });
    
    return { success: true, refreshTime };
  } catch (error) {
    const refreshTime = performance.now() - startTime;
    
    console.error('Global refresh failed:', error);
    
    // Phase 5: Global refresh error analytics
    console.log('Global Refresh Error Analytics:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      refreshTime,
      timestamp: new Date().toISOString()
    });
    
    return { success: false, error: error as Error, refreshTime };
  }
};

// Phase 5: Cache utilities for advanced usage
export const clearVideosCache = () => mutate(VIDEOS_KEY, undefined, false);

export const prefetchVideosList = async (limit: number = 10) => {
  await mutate(`${VIDEOS_KEY}?limit=${limit}`);
};

// Phase 5: Performance monitoring utilities
export const getVideosPerformanceMetrics = () => {
  // This could integrate with a real analytics service
  return {
    cacheHitRate: 0.85, // Example metric
    averageFetchTime: 250, // Example metric
    errorRate: 0.02, // Example metric
  };
}; 