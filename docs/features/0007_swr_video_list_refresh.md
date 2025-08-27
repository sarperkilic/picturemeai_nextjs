# SWR Video List Refresh Implementation

## Goal
Implement SWR-based data fetching and caching for the video list in the dashboard, replacing the current real-time subscription approach with a more efficient refresh mechanism that updates the Generated Videos section without refreshing the whole page.

## Current State Analysis

### Existing Implementation
- **Real-time Updates**: Uses `useProjectsRealtime` hook with Firestore subscriptions
- **Refresh Mechanism**: Uses `refreshTrigger` in UGC store to trigger manual refreshes
- **Data Flow**: Projects fetched via `fetchProjectsForDashboard` in projects store
- **Refresh Button**: Currently reloads entire page with `window.location.reload()`

### Current Files Involved
- `components/dashboard/GeneratedVideosSection.tsx` - Main video list component
- `lib/use-realtime-updates.ts` - Real-time subscription hooks
- `lib/projects-store.ts` - Zustand store for projects
- `lib/ugc-store.ts` - UGC store with refresh trigger
- `app/api/projects/route.ts` - Projects API endpoint

## Technical Requirements

### Phase 1: SWR Integration and Hook Creation
**Goal**: Create reusable SWR hook for video fetching and replace real-time subscriptions

**Files to Create/Modify:**

#### 1. Create `lib/hooks/use-videos.ts`
```typescript
import useSWR, { mutate } from 'swr';
import { useSession } from '@/lib/use-firebase-auth';
import { Project } from '@/types/firebase';

// Consistent cache key for all video operations
export const VIDEOS_KEY = '/api/projects';

interface UseVideosOptions {
  limit?: number;
  refreshInterval?: number;
}

export function useVideos(options: UseVideosOptions = {}) {
  const { user } = useSession();
  const { limit = 10, refreshInterval = 5000 } = options;
  
  const { data, error, isLoading, mutate: refreshVideos } = useSWR(
    user?.id ? `${VIDEOS_KEY}?limit=${limit}` : null,
    async (url) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await user?.getIdToken()}`,
        },
      });
      
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
      
      return result.projects;
    },
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onError: (error) => {
        console.error('SWR error:', error);
      },
    }
  );

  // Conditional polling: only poll when videos are processing
  const hasProcessingVideos = data?.some(video => video.status !== 'complete');
  const effectiveRefreshInterval = hasProcessingVideos ? refreshInterval : 0;

  return {
    videos: data || [],
    isLoading,
    error,
    refreshVideos,
    hasProcessingVideos,
  };
}

// Global mutate function using consistent key
export const refreshVideosList = () => mutate(VIDEOS_KEY);
```

#### 2. Update `components/dashboard/GeneratedVideosSection.tsx`
```typescript
// Replace real-time subscription with SWR hook
import { useVideos } from '@/lib/hooks/use-videos';

export function GeneratedVideosSection() {
  const { user } = useSession();
  const { setIsModalOpen } = useUGCStore();
  const { videos, isLoading, error, refreshVideos, hasProcessingVideos } = useVideos({ limit: 10 });
  
  // Remove real-time subscription code
  // Remove refreshTrigger logic
  
  // Update refresh button to use SWR mutate
  const handleRefresh = () => {
    refreshVideos();
  };
  
  // Show polling indicator when videos are processing
  const showPollingIndicator = hasProcessingVideos && !isLoading;
  
  // Rest of component remains the same but uses 'videos' instead of 'projects'
}
```

### Phase 2: API Endpoint Optimization
**Goal**: Ensure API endpoint supports SWR caching and efficient data fetching

**Files to Modify:**

#### 3. Update `app/api/projects/route.ts`
```typescript
// Add proper caching headers for SWR
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = session.user.id;

    const projects = await getUserProjects(userId, limit);

    const response = NextResponse.json({
      success: true,
      projects,
    });
    
    // User-specific data - disable CDN caching, let SWR handle it
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
```

### Phase 3: UGC Modal Integration
**Goal**: Update UGC modal to trigger SWR refresh instead of using refresh trigger

**Files to Modify:**

#### 4. Update `components/dashboard/UGCModal.tsx`
```typescript
// Replace refresh trigger with SWR mutate
import { refreshVideosList } from '@/lib/hooks/use-videos';

export function UGCModal() {
  // Remove refreshTrigger usage
  
  const handleGenerate = async () => {
    // ... existing generation logic ...
    
    if (result.success) {
      // Trigger SWR refresh using consistent key
      refreshVideosList();
      showToast('Video generation started successfully!', 'success');
    }
  };
}
```

### Phase 4: Remove Legacy Code
**Goal**: Clean up old real-time subscription and refresh trigger code

**Files to Clean Up:**

#### 5. Update `lib/ugc-store.ts`
```typescript
// Remove refreshTrigger from state and actions
interface UGCActions {
  // Remove triggerRefresh action
  // Remove refreshTrigger from state
}

const initialState: UGCState = {
  // Remove refreshTrigger: 0,
};
```

#### 6. Update `types/ugc.ts`
```typescript
// Remove refreshTrigger from UGCState interface
export interface UGCState {
  // Remove refreshTrigger: number;
}
```

#### 7. Clean up `lib/use-realtime-updates.ts`
```typescript
// Remove or deprecate useProjectsRealtime hook
// Keep other real-time hooks for specific use cases
// Consider hybrid approach: SWR for caching + Firestore for real-time status updates
```

### Phase 5: Enhanced Refresh Button
**Goal**: Update refresh button to only refresh videos section

**Files to Modify:**

#### 8. Update `components/dashboard/GeneratedVideosSection.tsx`
```typescript
// Replace window.location.reload() with SWR refresh
const handleRefresh = () => {
  refreshVideos();
};

// Update refresh button with loading state
<Button
  isIconOnly
  variant='light'
  onClick={handleRefresh}
  isLoading={isLoading}
  disabled={isLoading}
>
  <RefreshIcon className='w-4 h-4' />
</Button>
```

## Implementation Steps

### Step 1: Install SWR
```bash
npm install swr
```

### Step 2: Create SWR Provider
Create `app/providers.tsx` or update existing to include SWR provider:

```typescript
import { SWRConfig } from 'swr';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => fetch(url).then(res => res.json()),
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        onError: (error) => {
          console.error('SWR global error:', error);
        },
        // Retry failed requests
        errorRetryCount: 3,
        errorRetryInterval: 1000,
      }}
    >
      {children}
    </SWRConfig>
  );
}
```

### Step 3: Implement Phases in Order
1. Create `use-videos.ts` hook
2. Update `GeneratedVideosSection.tsx` to use SWR
3. Update API endpoint with caching headers
4. Update UGC modal to use SWR refresh
5. Clean up legacy code
6. Test refresh functionality

## Benefits

### Performance Improvements
- **Efficient Caching**: SWR provides intelligent caching and background updates
- **Reduced API Calls**: Automatic deduplication of requests with conditional polling
- **Optimistic Updates**: Immediate UI updates with background validation
- **Smart Polling**: Only polls when videos are processing, stops when all complete

### User Experience
- **Faster Loading**: Cached data loads instantly
- **Background Updates**: Data refreshes automatically only when needed
- **Manual Refresh**: Refresh button only updates video section
- **No Page Reloads**: Smooth updates without full page refresh
- **Real-time Feel**: Conditional polling provides near real-time updates for processing videos

### Developer Experience
- **Simplified State Management**: SWR handles loading, error, and data states
- **Consistent Cache Keys**: Single `VIDEOS_KEY` constant for all operations
- **Type Safety**: Proper TypeScript validation of API responses
- **Error Handling**: Comprehensive error handling with retry logic
- **Debugging**: Built-in dev tools for SWR

## Migration Strategy

### Backward Compatibility
- Keep existing API endpoints unchanged
- Maintain existing data structures
- Gradual migration from real-time to SWR

### Rollback Plan
- Keep real-time hooks as fallback
- Feature flag for SWR vs real-time
- Easy switch back if issues arise

### Hybrid Approach Consideration
- **Option A**: Full SWR migration (current plan)
- **Option B**: Hybrid approach - SWR for caching + Firestore for real-time status updates
  - Use SWR for initial data loading and caching
  - Keep Firestore subscription only for status changes
  - Best of both worlds: caching + real-time updates

## Testing Strategy

### Unit Tests
- Test `use-videos` hook with mock data
- Test API endpoint caching headers
- Test refresh functionality
- Test conditional polling logic
- Test error handling and retry logic

### Integration Tests
- Test video generation flow with SWR refresh
- Test manual refresh button
- Test automatic background updates
- Test conditional polling (stops when all videos complete)

### Performance Tests
- Measure API call reduction
- Test caching effectiveness
- Monitor memory usage
- Test polling efficiency (should stop when no processing videos)

### Network Edge Case Tests
- **401 Unauthorized**: Test expired token handling and re-auth flow
- **500 Server Error**: Test error state display without crashes
- **Empty Response**: Test "No videos yet" display
- **Network Timeout**: Test retry logic and user feedback
- **Partial Data**: Test graceful handling of incomplete responses

## Success Criteria
- [ ] Video list loads from cache on subsequent visits
- [ ] Refresh button only updates video section
- [ ] UGC modal triggers video list refresh
- [ ] Conditional polling works (stops when all videos complete)
- [ ] No full page reloads required
- [ ] Reduced API calls compared to real-time subscriptions
- [ ] Improved loading performance
- [ ] Proper error handling for network issues
- [ ] Consistent cache key usage across all components
- [ ] User-specific data properly secured (no CDN caching) 