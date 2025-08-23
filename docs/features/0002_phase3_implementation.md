# Phase 3 Implementation: Analytics - Collection-Group Queries and Analytics Dashboard

## Overview
Phase 3 implements the analytics layer for the projects and renders database feature, including collection-group queries for cross-project analytics, performance optimization, and an analytics dashboard for monitoring system health and user activity.

## Files Created/Modified

### Analytics Infrastructure

#### 1. Create `lib/analytics.ts`
**Collection-group queries and analytics functions:**

```typescript
import { collectionGroup, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '@/types/firebase';
import { Render, Project } from '@/types/firebase';

export interface RenderAnalytics {
  totalRenders: number;
  successfulRenders: number;
  failedRenders: number;
  averageProcessingTime: number;
  rendersByProvider: Record<string, number>;
  rendersByStatus: Record<string, number>;
  recentFailures: Render[];
}

export interface ProjectAnalytics {
  totalProjects: number;
  completedProjects: number;
  activeProjects: number;
  averageProjectDuration: number;
  projectsByStatus: Record<string, number>;
  creditUsage: {
    total: number;
    average: number;
  };
}

export interface SystemAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalCreditsConsumed: number;
  systemHealth: {
    successRate: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

// Get all failed renders across all projects (last 24h)
export async function getFailedRendersLast24h(): Promise<Render[]> {
  try {
    const rendersRef = collectionGroup(db, COLLECTIONS.RENDERS);
    const twentyFourHoursAgo = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    
    const failedQuery = query(
      rendersRef,
      where('status', '==', 'failed'),
      where('createdAt', '>=', twentyFourHoursAgo),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    
    const snapshot = await getDocs(failedQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
  } catch (error) {
    console.error('Error getting failed renders:', error);
    return [];
  }
}

// Get all renders by provider across all projects
export async function getRendersByProvider(provider: string, limitCount: number = 50): Promise<Render[]> {
  try {
    const rendersRef = collectionGroup(db, COLLECTIONS.RENDERS);
    const providerQuery = query(
      rendersRef,
      where('model', '==', provider),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(providerQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
  } catch (error) {
    console.error('Error getting renders by provider:', error);
    return [];
  }
}

// Get user's total render statistics
export async function getUserRenderStats(userId: string): Promise<RenderAnalytics> {
  try {
    const rendersRef = collectionGroup(db, COLLECTIONS.RENDERS);
    const userRendersQuery = query(
      rendersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(userRendersQuery);
    const renders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];

    const totalRenders = renders.length;
    const successfulRenders = renders.filter(r => r.status === 'succeeded').length;
    const failedRenders = renders.filter(r => r.status === 'failed').length;
    
    const rendersByProvider: Record<string, number> = {};
    const rendersByStatus: Record<string, number> = {};
    
    renders.forEach(render => {
      rendersByProvider[render.model] = (rendersByProvider[render.model] || 0) + 1;
      rendersByStatus[render.status] = (rendersByStatus[render.status] || 0) + 1;
    });

    // Calculate average processing time for successful renders
    const successfulRendersWithTime = renders.filter(r => 
      r.status === 'succeeded' && r.createdAt && r.updatedAt
    );
    
    const averageProcessingTime = successfulRendersWithTime.length > 0
      ? successfulRendersWithTime.reduce((acc, render) => {
          const processingTime = render.updatedAt.toMillis() - render.createdAt.toMillis();
          return acc + processingTime;
        }, 0) / successfulRendersWithTime.length / 1000 // Convert to seconds
      : 0;

    const recentFailures = renders
      .filter(r => r.status === 'failed')
      .slice(0, 10);

    return {
      totalRenders,
      successfulRenders,
      failedRenders,
      averageProcessingTime,
      rendersByProvider,
      rendersByStatus,
      recentFailures,
    };
  } catch (error) {
    console.error('Error getting user render stats:', error);
    return {
      totalRenders: 0,
      successfulRenders: 0,
      failedRenders: 0,
      averageProcessingTime: 0,
      rendersByProvider: {},
      rendersByStatus: {},
      recentFailures: [],
    };
  }
}

// Get system-wide analytics (admin only)
export async function getSystemAnalytics(): Promise<SystemAnalytics> {
  try {
    // This would require admin SDK access
    // For now, return mock data or implement with admin SDK
    return {
      totalUsers: 0,
      activeUsers: 0,
      totalCreditsConsumed: 0,
      systemHealth: {
        successRate: 0,
        averageResponseTime: 0,
        errorRate: 0,
      },
    };
  } catch (error) {
    console.error('Error getting system analytics:', error);
    throw error;
  }
}

// Get renders by status across all projects
export async function getRendersByStatus(status: string, limitCount: number = 50): Promise<Render[]> {
  try {
    const rendersRef = collectionGroup(db, COLLECTIONS.RENDERS);
    const statusQuery = query(
      rendersRef,
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(statusQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
  } catch (error) {
    console.error('Error getting renders by status:', error);
    return [];
  }
}

// Get recent activity across all projects
export async function getRecentActivity(limitCount: number = 20): Promise<{
  renders: Render[];
  projects: Project[];
}> {
  try {
    const rendersRef = collectionGroup(db, COLLECTIONS.RENDERS);
    const projectsRef = collectionGroup(db, COLLECTIONS.PROJECTS);
    
    const recentRendersQuery = query(
      rendersRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const recentProjectsQuery = query(
      projectsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const [rendersSnapshot, projectsSnapshot] = await Promise.all([
      getDocs(recentRendersQuery),
      getDocs(recentProjectsQuery),
    ]);
    
    const renders = rendersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
    
    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
    
    return { renders, projects };
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return { renders: [], projects: [] };
  }
}
```

### Analytics Dashboard Components

#### 2. Create `components/analytics/AnalyticsDashboard.tsx`
**Main analytics dashboard component:**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Select, SelectItem } from '@heroui/select';

import { RefreshIcon } from '@/components/icons';
import { RenderAnalytics, ProjectAnalytics, SystemAnalytics } from '@/lib/analytics';
import { AnalyticsOverview } from './AnalyticsOverview';
import { RenderStats } from './RenderStats';
import { ProjectStats } from './ProjectStats';
import { SystemHealth } from './SystemHealth';
import { RecentActivity } from './RecentActivity';

export function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [renderStats, setRenderStats] = useState<RenderAnalytics | null>(null);
  const [projectStats, setProjectStats] = useState<ProjectAnalytics | null>(null);
  const [systemStats, setSystemStats] = useState<SystemAnalytics | null>(null);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Load analytics data based on time range
      // This would be implemented based on your specific requirements
      console.log('Loading analytics for time range:', timeRange);
      
      // Mock data for now
      setRenderStats({
        totalRenders: 1250,
        successfulRenders: 1180,
        failedRenders: 70,
        averageProcessingTime: 45.2,
        rendersByProvider: {
          'elevenlabs': 450,
          'heygen': 380,
          'did': 420,
        },
        rendersByStatus: {
          'succeeded': 1180,
          'failed': 70,
          'running': 15,
          'queued': 5,
        },
        recentFailures: [],
      });

      setProjectStats({
        totalProjects: 890,
        completedProjects: 820,
        activeProjects: 70,
        averageProjectDuration: 18.5,
        projectsByStatus: {
          'complete': 820,
          'rendering': 45,
          'ready': 15,
          'draft': 10,
        },
        creditUsage: {
          total: 4450,
          average: 5.0,
        },
      });

      setSystemStats({
        totalUsers: 1250,
        activeUsers: 890,
        totalCreditsConsumed: 44500,
        systemHealth: {
          successRate: 94.4,
          averageResponseTime: 2.3,
          errorRate: 5.6,
        },
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  return (
    <div className='w-full space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-foreground'>Analytics Dashboard</h1>
          <p className='text-default-500 mt-1'>
            Monitor system performance and user activity
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Select
            selectedKeys={[timeRange]}
            onSelectionChange={(keys) => setTimeRange(Array.from(keys)[0] as string)}
            className='w-32'
          >
            <SelectItem key='1h'>Last Hour</SelectItem>
            <SelectItem key='24h'>Last 24h</SelectItem>
            <SelectItem key='7d'>Last 7 Days</SelectItem>
            <SelectItem key='30d'>Last 30 Days</SelectItem>
          </Select>
          <Button
            isIconOnly
            variant='light'
            onClick={loadAnalytics}
            isLoading={isLoading}
          >
            <RefreshIcon className='w-4 h-4' />
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className='flex items-center justify-center py-12'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          <span className='ml-3 text-default-500'>Loading analytics...</span>
        </div>
      ) : (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <AnalyticsOverview 
            renderStats={renderStats}
            projectStats={projectStats}
            systemStats={systemStats}
          />
          
          <RenderStats stats={renderStats} />
          
          <ProjectStats stats={projectStats} />
          
          <SystemHealth stats={systemStats} />
          
          <div className='lg:col-span-2'>
            <RecentActivity timeRange={timeRange} />
          </div>
        </div>
      )}
    </div>
  );
}
```

#### 3. Create `components/analytics/AnalyticsOverview.tsx`
**Overview cards component:**

```typescript
'use client';

import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';

import { RenderAnalytics, ProjectAnalytics, SystemAnalytics } from '@/lib/analytics';

interface AnalyticsOverviewProps {
  renderStats: RenderAnalytics | null;
  projectStats: ProjectAnalytics | null;
  systemStats: SystemAnalytics | null;
}

export function AnalyticsOverview({ renderStats, projectStats, systemStats }: AnalyticsOverviewProps) {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatTime = (seconds: number) => {
    return `${seconds.toFixed(1)}s`;
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
      {/* Total Renders */}
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-default-500'>Total Renders</p>
              <p className='text-2xl font-bold text-foreground'>
                {formatNumber(renderStats?.totalRenders || 0)}
              </p>
            </div>
            <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
              <span className='text-primary font-semibold'>R</span>
            </div>
          </div>
          <div className='mt-2'>
            <Chip
              size='sm'
              color='success'
              variant='flat'
            >
              {formatPercentage(renderStats ? (renderStats.successfulRenders / renderStats.totalRenders) * 100 : 0)} Success
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Total Projects */}
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-default-500'>Total Projects</p>
              <p className='text-2xl font-bold text-foreground'>
                {formatNumber(projectStats?.totalProjects || 0)}
              </p>
            </div>
            <div className='w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center'>
              <span className='text-secondary font-semibold'>P</span>
            </div>
          </div>
          <div className='mt-2'>
            <Chip
              size='sm'
              color='primary'
              variant='flat'
            >
              {formatNumber(projectStats?.activeProjects || 0)} Active
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Active Users */}
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-default-500'>Active Users</p>
              <p className='text-2xl font-bold text-foreground'>
                {formatNumber(systemStats?.activeUsers || 0)}
              </p>
            </div>
            <div className='w-12 h-12 bg-success/10 rounded-full flex items-center justify-center'>
              <span className='text-success font-semibold'>U</span>
            </div>
          </div>
          <div className='mt-2'>
            <Chip
              size='sm'
              color='default'
              variant='flat'
            >
              {formatNumber(systemStats?.totalUsers || 0)} Total
            </Chip>
          </div>
        </CardBody>
      </Card>

      {/* Success Rate */}
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-default-500'>Success Rate</p>
              <p className='text-2xl font-bold text-foreground'>
                {formatPercentage(systemStats?.systemHealth.successRate || 0)}
              </p>
            </div>
            <div className='w-12 h-12 bg-warning/10 rounded-full flex items-center justify-center'>
              <span className='text-warning font-semibold'>%</span>
            </div>
          </div>
          <div className='mt-2'>
            <Chip
              size='sm'
              color='warning'
              variant='flat'
            >
              {formatTime(systemStats?.systemHealth.averageResponseTime || 0)} Avg
            </Chip>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
```

#### 4. Create `components/analytics/RenderStats.tsx`
**Render statistics component:**

```typescript
'use client';

import { Card, CardBody } from '@heroui/card';
import { Progress } from '@heroui/progress';

import { RenderAnalytics } from '@/lib/analytics';

interface RenderStatsProps {
  stats: RenderAnalytics | null;
}

export function RenderStats({ stats }: RenderStatsProps) {
  if (!stats) return null;

  const successRate = stats.totalRenders > 0 
    ? (stats.successfulRenders / stats.totalRenders) * 100 
    : 0;

  const failureRate = stats.totalRenders > 0 
    ? (stats.failedRenders / stats.totalRenders) * 100 
    : 0;

  return (
    <Card className='bg-content1/60 border border-default-100'>
      <CardBody className='p-6'>
        <h3 className='text-lg font-semibold text-foreground mb-4'>Render Statistics</h3>
        
        <div className='space-y-4'>
          {/* Success Rate */}
          <div>
            <div className='flex justify-between text-sm mb-2'>
              <span className='text-default-600'>Success Rate</span>
              <span className='font-medium'>{successRate.toFixed(1)}%</span>
            </div>
            <Progress
              value={successRate}
              color='success'
              className='w-full'
            />
          </div>

          {/* Failure Rate */}
          <div>
            <div className='flex justify-between text-sm mb-2'>
              <span className='text-default-600'>Failure Rate</span>
              <span className='font-medium'>{failureRate.toFixed(1)}%</span>
            </div>
            <Progress
              value={failureRate}
              color='danger'
              className='w-full'
            />
          </div>

          {/* Average Processing Time */}
          <div className='pt-2'>
            <div className='flex justify-between text-sm'>
              <span className='text-default-600'>Avg Processing Time</span>
              <span className='font-medium'>{stats.averageProcessingTime.toFixed(1)}s</span>
            </div>
          </div>

          {/* Provider Breakdown */}
          <div className='pt-4'>
            <h4 className='text-sm font-medium text-foreground mb-3'>By Provider</h4>
            <div className='space-y-2'>
              {Object.entries(stats.rendersByProvider).map(([provider, count]) => (
                <div key={provider} className='flex justify-between text-sm'>
                  <span className='text-default-600 capitalize'>{provider}</span>
                  <span className='font-medium'>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
```

### Performance Optimization

#### 5. Create `lib/analytics-cache.ts`
**Analytics data caching for performance:**

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }
}

export const analyticsCache = new AnalyticsCache();

// Cached analytics functions
export async function getCachedUserRenderStats(userId: string): Promise<RenderAnalytics> {
  const cacheKey = `user-render-stats-${userId}`;
  const cached = analyticsCache.get<RenderAnalytics>(cacheKey);
  
  if (cached) {
    return cached;
  }

  const stats = await getUserRenderStats(userId);
  analyticsCache.set(cacheKey, stats, 2 * 60 * 1000); // 2 minutes TTL
  
  return stats;
}
```

### Analytics API Endpoints

#### 6. Create `app/api/analytics/dashboard/route.ts`
**Dashboard analytics endpoint:**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { 
  getSystemAnalytics, 
  getRecentActivity,
  getFailedRendersLast24h 
} from '@/lib/analytics';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const userData = await auth.api.getUserData(session.user.id);
    if (userData?.tier !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '24h';

    const [systemStats, recentActivity, failedRenders] = await Promise.all([
      getSystemAnalytics(),
      getRecentActivity(20),
      getFailedRendersLast24h(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        systemStats,
        recentActivity,
        failedRenders,
        timeRange,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
```

### Testing Strategy

#### 7. Analytics Testing
**Test files for analytics functions:**

```typescript
// Example test for analytics functions
describe('Analytics Functions', () => {
  describe('getFailedRendersLast24h', () => {
    it('should return failed renders from last 24 hours', async () => {
      // Test implementation
    });
  });

  describe('getUserRenderStats', () => {
    it('should return user render statistics', async () => {
      // Test implementation
    });
  });

  describe('AnalyticsCache', () => {
    it('should cache and retrieve data correctly', () => {
      // Test implementation
    });

    it('should expire cached data after TTL', () => {
      // Test implementation
    });
  });
});
```

## Performance Considerations

### Query Optimization
- Use composite indexes for complex collection-group queries
- Implement pagination for large datasets
- Cache frequently accessed analytics data
- Use batch operations for multiple queries

### Real-time Updates
- Implement debounced updates to prevent excessive writes
- Use Firestore listeners for real-time analytics updates
- Optimize listener cleanup to prevent memory leaks

### Data Retention
- Implement data archival for old analytics data
- Use Firestore TTL for automatic data cleanup
- Compress historical data for storage efficiency

## Security Considerations

### Access Control
- Restrict analytics access to admin users only
- Implement rate limiting for analytics endpoints
- Validate all query parameters to prevent injection attacks

### Data Privacy
- Anonymize user data in analytics
- Implement data retention policies
- Ensure compliance with privacy regulations