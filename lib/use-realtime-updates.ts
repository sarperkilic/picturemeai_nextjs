import { useEffect, useRef } from 'react';
import { useSession } from './use-firebase-auth';
import { useProjectsStore } from './projects-store';
import { 
  subscribeToProjectUpdates, 
  subscribeToUserProjects, 
  subscribeToActiveRenders,
  subscribeToProjectsByStatus,
  subscribeToProjectRenders,
  subscribeToRendersByStatus
} from './projects-realtime';
import { Project, Render } from '@/types/firebase';
import { useState } from 'react';

/**
 * Hook for real-time project updates
 */
export function useProjectRealtime(projectId: string) {
  const { user } = useSession();
  const { setCurrentProject } = useProjectsStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.id || !projectId) return;

    const unsubscribe = subscribeToProjectUpdates(user.id, projectId, (project, renders) => {
      setCurrentProject(project);
      // Note: Renders are handled separately or can be stored in local state if needed
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, projectId, setCurrentProject]);

  return {
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  };
}

/**
 * Hook for real-time projects list updates
 */
export function useProjectsRealtime(limit: number = 10) {
  const { user } = useSession();
  const { projects, isLoading, error, setProjects } = useProjectsStore();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const unsubscribe = subscribeToUserProjects(user.id, limit, (updatedProjects) => {
      // Update the store with real-time data
      setProjects(updatedProjects);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, limit, setProjects]);

  return {
    projects,
    isLoading,
    error,
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  };
}

/**
 * Hook for real-time projects by status
 */
export function useProjectsByStatusRealtime(status: string, limit: number = 10) {
  const { user } = useSession();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToProjectsByStatus(user.id, status, limit, (updatedProjects) => {
      setProjects(updatedProjects);
      setIsLoading(false);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, status, limit]);

  return {
    projects,
    isLoading,
    error,
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  };
}

/**
 * Hook for real-time renders of a specific project
 */
export function useProjectRendersRealtime(projectId: string) {
  const { user } = useSession();
  const [renders, setRenders] = useState<Render[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.id || !projectId) return;

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToProjectRenders(user.id, projectId, (updatedRenders) => {
      setRenders(updatedRenders);
      setIsLoading(false);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, projectId]);

  return {
    renders,
    isLoading,
    error,
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  };
}

/**
 * Hook for real-time active renders (queued or running)
 */
export function useActiveRendersRealtime(projectId: string) {
  const { user } = useSession();
  const [activeRenders, setActiveRenders] = useState<Render[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.id || !projectId) return;

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToActiveRenders(user.id, projectId, (updatedRenders) => {
      setActiveRenders(updatedRenders);
      setIsLoading(false);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, projectId]);

  return {
    activeRenders,
    isLoading,
    error,
    hasActiveRenders: activeRenders.length > 0,
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  };
}

/**
 * Hook for real-time renders by status
 */
export function useRendersByStatusRealtime(projectId: string, status: string) {
  const { user } = useSession();
  const [renders, setRenders] = useState<Render[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!user?.id || !projectId) return;

    setIsLoading(true);
    setError(null);

    const unsubscribe = subscribeToRendersByStatus(user.id, projectId, status, (updatedRenders) => {
      setRenders(updatedRenders);
      setIsLoading(false);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [user?.id, projectId, status]);

  return {
    renders,
    isLoading,
    error,
    unsubscribe: () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    }
  };
} 