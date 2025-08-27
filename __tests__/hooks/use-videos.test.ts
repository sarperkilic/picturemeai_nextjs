import { renderHook, waitFor } from '@testing-library/react';
import { useVideos, refreshVideosList, clearVideosCache } from '@/lib/hooks/use-videos';
import { useSession } from '@/lib/use-firebase-auth';
import { FirebaseAuthClient } from '@/lib/firebase-auth';

// Mock dependencies
jest.mock('@/lib/use-firebase-auth');
jest.mock('@/lib/firebase-auth');
jest.mock('swr');

const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;
const mockFirebaseAuthClient = FirebaseAuthClient as jest.Mocked<typeof FirebaseAuthClient>;

describe('useVideos Hook - Phase 5', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock session
    mockUseSession.mockReturnValue({
      user: { id: 'test-user-id' },
      isLoading: false,
    });
    
    // Mock Firebase auth
    mockFirebaseAuthClient.getIdToken.mockResolvedValue('mock-token');
  });

  describe('Basic Functionality', () => {
    it('should return videos data when API call succeeds', async () => {
      const mockVideos = [
        { id: '1', title: 'Test Video 1', status: 'complete' },
        { id: '2', title: 'Test Video 2', status: 'rendering' },
      ];

      // Mock successful API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, projects: mockVideos }),
      });

      const { result } = renderHook(() => useVideos({ limit: 10 }));

      await waitFor(() => {
        expect(result.current.videos).toEqual(mockVideos);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBe(null);
      });
    });

    it('should handle API errors gracefully', async () => {
      // Mock failed API response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ success: false, error: 'Server error' }),
      });

      const { result } = renderHook(() => useVideos({ limit: 10 }));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should handle authentication errors', async () => {
      // Mock 401 response
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ success: false, error: 'Unauthorized' }),
      });

      const { result } = renderHook(() => useVideos({ limit: 10 }));

      await waitFor(() => {
        expect(result.current.error?.message).toBe('Authentication expired');
      });
    });
  });

  describe('Performance Monitoring - Phase 5', () => {
    it('should track performance metrics when enabled', async () => {
      const mockVideos = [{ id: '1', title: 'Test Video', status: 'complete' }];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, projects: mockVideos }),
      });

      const { result } = renderHook(() => 
        useVideos({ 
          limit: 10, 
          enablePerformanceMonitoring: true 
        })
      );

      await waitFor(() => {
        expect(result.current.performanceMetrics).toBeTruthy();
        expect(result.current.performanceMetrics?.fetchTime).toBeGreaterThan(0);
        expect(result.current.performanceMetrics?.errorCount).toBe(0);
      });
    });

    it('should not track performance metrics when disabled', () => {
      const { result } = renderHook(() => 
        useVideos({ 
          limit: 10, 
          enablePerformanceMonitoring: false 
        })
      );

      expect(result.current.performanceMetrics).toBe(null);
    });

    it('should track error counts correctly', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => 
        useVideos({ 
          limit: 10, 
          enablePerformanceMonitoring: true 
        })
      );

      await waitFor(() => {
        expect(result.current.performanceMetrics?.errorCount).toBe(1);
      });
    });
  });

  describe('Advanced Caching - Phase 5', () => {
    it('should use advanced caching when enabled', async () => {
      const mockVideos = [{ id: '1', title: 'Test Video', status: 'complete' }];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, projects: mockVideos }),
      });

      renderHook(() => 
        useVideos({ 
          limit: 10, 
          enableAdvancedCaching: true 
        })
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects?limit=10'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
            }),
            cache: 'no-store',
          })
        );
      });
    });

    it('should not use advanced caching when disabled', async () => {
      const mockVideos = [{ id: '1', title: 'Test Video', status: 'complete' }];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, projects: mockVideos }),
      });

      renderHook(() => 
        useVideos({ 
          limit: 10, 
          enableAdvancedCaching: false 
        })
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/projects?limit=10'),
          expect.objectContaining({
            headers: expect.objectContaining({
              'Authorization': 'Bearer mock-token',
            }),
          })
        );
        
        // Should not have cache: 'no-store'
        const fetchCall = global.fetch as jest.Mock;
        const options = fetchCall.mock.calls[0][1];
        expect(options.cache).toBeUndefined();
      });
    });
  });

  describe('Video Status Analytics', () => {
    it('should correctly count video statuses', async () => {
      const mockVideos = [
        { id: '1', title: 'Video 1', status: 'complete' },
        { id: '2', title: 'Video 2', status: 'rendering' },
        { id: '3', title: 'Video 3', status: 'draft' },
        { id: '4', title: 'Video 4', status: 'ready' },
        { id: '5', title: 'Video 5', status: 'complete' },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, projects: mockVideos }),
      });

      const { result } = renderHook(() => useVideos({ limit: 10 }));

      await waitFor(() => {
        expect(result.current.totalVideos).toBe(5);
        expect(result.current.completedCount).toBe(2);
        expect(result.current.processingCount).toBe(3);
        expect(result.current.hasProcessingVideos).toBe(true);
      });
    });

    it('should detect when no videos are processing', async () => {
      const mockVideos = [
        { id: '1', title: 'Video 1', status: 'complete' },
        { id: '2', title: 'Video 2', status: 'complete' },
      ];

      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ success: true, projects: mockVideos }),
      });

      const { result } = renderHook(() => useVideos({ limit: 10 }));

      await waitFor(() => {
        expect(result.current.hasProcessingVideos).toBe(false);
        expect(result.current.processingCount).toBe(0);
      });
    });
  });

  describe('Cache Management - Phase 5', () => {
    it('should provide cache management utilities', async () => {
      const { result } = renderHook(() => useVideos({ limit: 10 }));

      expect(typeof result.current.clearCache).toBe('function');
      expect(typeof result.current.prefetchVideos).toBe('function');
    });

    it('should clear cache when clearCache is called', () => {
      const { result } = renderHook(() => useVideos({ limit: 10 }));

      // Mock the mutate function
      const mockMutate = jest.fn();
      jest.spyOn(require('swr'), 'mutate').mockImplementation(mockMutate);

      result.current.clearCache();

      expect(mockMutate).toHaveBeenCalledWith('/api/projects', undefined, false);
    });
  });

  describe('Global Functions', () => {
    it('should provide global refresh function', () => {
      const mockMutate = jest.fn();
      jest.spyOn(require('swr'), 'mutate').mockImplementation(mockMutate);

      refreshVideosList();

      expect(mockMutate).toHaveBeenCalledWith('/api/projects');
    });

    it('should provide cache clearing function', () => {
      const mockMutate = jest.fn();
      jest.spyOn(require('swr'), 'mutate').mockImplementation(mockMutate);

      clearVideosCache();

      expect(mockMutate).toHaveBeenCalledWith('/api/projects', undefined, false);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch = jest.fn().mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useVideos({ limit: 10 }));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
        expect(result.current.error?.message).toContain('Network error');
      });
    });

    it('should handle malformed JSON responses', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useVideos({ limit: 10 }));

      await waitFor(() => {
        expect(result.current.error).toBeTruthy();
      });
    });
  });

  describe('Configuration Options', () => {
    it('should respect custom retry configuration', () => {
      const { result } = renderHook(() => 
        useVideos({ 
          limit: 5, 
          retryCount: 5, 
          retryInterval: 2000 
        })
      );

      expect(result.current).toBeDefined();
      // The retry configuration would be tested in the SWR configuration
    });

    it('should respect custom refresh interval', () => {
      const { result } = renderHook(() => 
        useVideos({ 
          limit: 10, 
          refreshInterval: 10000 
        })
      );

      expect(result.current).toBeDefined();
      // The refresh interval would be tested in the SWR configuration
    });
  });
}); 