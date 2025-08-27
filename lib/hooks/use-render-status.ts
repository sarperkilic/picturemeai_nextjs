import useSWR from 'swr';
import { useSession } from '@/lib/use-firebase-auth';
import { FirebaseAuthClient } from '@/lib/firebase-auth';
import { Render } from '@/types/firebase';

// Consistent cache key for render status
export const RENDER_STATUS_KEY = '/api/projects';

interface UseRenderStatusOptions {
  projectId: string;
  refreshInterval?: number;
}

export function useRenderStatus(options: UseRenderStatusOptions) {
  const { user } = useSession();
  const { projectId, refreshInterval = 2000 } = options;
  
  const { data, error, isLoading, mutate: refreshRenderStatus } = useSWR(
    user?.id && projectId ? `${RENDER_STATUS_KEY}/${projectId}/renders` : null,
    async (url) => {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${await FirebaseAuthClient.getIdToken()}`,
        },
      });
      
      if (response.status === 401) {
        throw new Error('Authentication expired');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch render status: ${response.status}`);
      }
      
      const result: { success: boolean; renders: Render[] } = await response.json();
      
      if (!result.success) {
        throw new Error('API returned error');
      }
      
      return result.renders;
    },
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      onError: (error) => {
        console.error('SWR render status error:', error);
      },
    }
  );

  const renders = data || [];
  
  // Calculate derived state
  const activeRenders = renders.filter(render => 
    render.status === 'queued' || render.status === 'running'
  );
  
  const hasActiveRenders = activeRenders.length > 0;
  
  // Calculate progress
  const totalRenders = renders.length;
  const completedRenders = renders.filter(render => render.status === 'succeeded').length;
  const failedRenders = renders.filter(render => render.status === 'failed').length;
  const progress = totalRenders > 0 ? (completedRenders / totalRenders) * 100 : 0;
  
  // Conditional polling: only poll when there are active renders
  const effectiveRefreshInterval = hasActiveRenders ? refreshInterval : 0;

  return {
    renders,
    activeRenders,
    hasActiveRenders,
    progress,
    isLoading,
    error,
    refreshRenderStatus,
    isComplete: completedRenders + failedRenders === totalRenders && totalRenders > 0,
  };
} 