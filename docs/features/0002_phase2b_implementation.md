# Phase 2B Implementation: Client-Side Integration - Projects and Renders UI

## Overview
Phase 2B implements the client-side integration for the projects and renders database feature, including state management, UI components, and integration with the existing UGC dashboard. This phase connects the API layer from Phase 2A with the user interface.

## Files Created/Modified

### State Management

#### 1. Create `lib/projects-store.ts`
**Zustand store for project state management:**

```typescript
import { create } from 'zustand';
import { Project, Render } from '@/types/firebase';
import { CreateProjectData, UpdateProjectData, CreateRenderData, UpdateRenderData } from '@/types/projects';

interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  currentProjectRenders: Render[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: (userId: string) => Promise<void>;
  fetchProjectsForDashboard: (userId: string, limit?: number) => Promise<void>;
  fetchProject: (userId: string, projectId: string) => Promise<void>;
  fetchProjectRenders: (userId: string, projectId: string) => Promise<void>;
  createProject: (userId: string, data: CreateProjectData) => Promise<Project>;
  updateProject: (userId: string, projectId: string, data: UpdateProjectData) => Promise<void>;
  deleteProject: (userId: string, projectId: string) => Promise<void>;
  createRender: (userId: string, projectId: string, data: CreateRenderData) => Promise<Render>;
  updateRender: (userId: string, projectId: string, renderId: string, data: UpdateRenderData) => Promise<void>;
  deleteRender: (userId: string, projectId: string, renderId: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  currentProject: null,
  currentProjectRenders: [],
  isLoading: false,
  error: null,

  fetchProjects: async (userId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      
      if (data.success) {
        set({ projects: data.projects, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch projects', isLoading: false });
    }
  },

  fetchProjectsForDashboard: async (userId: string, limit: number = 10) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        set({ projects: data.projects, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch projects', isLoading: false });
    }
  },

  fetchProject: async (userId: string, projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      const data = await response.json();
      
      if (data.success) {
        set({ currentProject: data.project, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch project', isLoading: false });
    }
  },

  fetchProjectRenders: async (userId: string, projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${projectId}/renders`);
      const data = await response.json();
      
      if (data.success) {
        set({ currentProjectRenders: data.renders, isLoading: false });
      } else {
        set({ error: data.error, isLoading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch renders', isLoading: false });
    }
  },

  createProject: async (userId: string, data: CreateProjectData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        const newProject = responseData.project;
        set(state => ({
          projects: [newProject, ...state.projects],
          isLoading: false,
        }));
        return newProject;
      } else {
        set({ error: responseData.error, isLoading: false });
        throw new Error(responseData.error);
      }
    } catch (error) {
      set({ error: 'Failed to create project', isLoading: false });
      throw error;
    }
  },

  updateProject: async (userId: string, projectId: string, data: UpdateProjectData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        set(state => ({
          projects: state.projects.map(p => 
            p.id === projectId ? { ...p, ...data } : p
          ),
          currentProject: state.currentProject?.id === projectId 
            ? { ...state.currentProject, ...data }
            : state.currentProject,
          isLoading: false,
        }));
      } else {
        set({ error: responseData.error, isLoading: false });
        throw new Error(responseData.error);
      }
    } catch (error) {
      set({ error: 'Failed to update project', isLoading: false });
      throw error;
    }
  },

  deleteProject: async (userId: string, projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        set(state => ({
          projects: state.projects.filter(p => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
          isLoading: false,
        }));
      } else {
        set({ error: responseData.error, isLoading: false });
        throw new Error(responseData.error);
      }
    } catch (error) {
      set({ error: 'Failed to delete project', isLoading: false });
      throw error;
    }
  },

  createRender: async (userId: string, projectId: string, data: CreateRenderData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${projectId}/renders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        const newRender = responseData.render;
        set(state => ({
          currentProjectRenders: [newRender, ...state.currentProjectRenders],
          isLoading: false,
        }));
        return newRender;
      } else {
        set({ error: responseData.error, isLoading: false });
        throw new Error(responseData.error);
      }
    } catch (error) {
      set({ error: 'Failed to create render', isLoading: false });
      throw error;
    }
  },

  updateRender: async (userId: string, projectId: string, renderId: string, data: UpdateRenderData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${projectId}/renders/${renderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        set(state => ({
          currentProjectRenders: state.currentProjectRenders.map(r => 
            r.id === renderId ? { ...r, ...data } : r
          ),
          isLoading: false,
        }));
      } else {
        set({ error: responseData.error, isLoading: false });
        throw new Error(responseData.error);
      }
    } catch (error) {
      set({ error: 'Failed to update render', isLoading: false });
      throw error;
    }
  },

  deleteRender: async (userId: string, projectId: string, renderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch(`/api/projects/${projectId}/renders/${renderId}`, {
        method: 'DELETE',
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        set(state => ({
          currentProjectRenders: state.currentProjectRenders.filter(r => r.id !== renderId),
          isLoading: false,
        }));
      } else {
        set({ error: responseData.error, isLoading: false });
        throw new Error(responseData.error);
      }
    } catch (error) {
      set({ error: 'Failed to delete render', isLoading: false });
      throw error;
    }
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  clearError: () => {
    set({ error: null });
  },
}));
```

### UI Components

#### 2. Update `components/dashboard/GeneratedVideosSection.tsx`
**Replace mock data with real projects from `users/{uid}/projects/`:**

```typescript
'use client';

import { useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';

import { RefreshIcon, SearchIcon, PlayIcon, DownloadIcon, ShareIcon } from '@/components/icons';
import { useProjectsStore } from '@/lib/projects-store';
import { useSession } from '@/lib/use-firebase-auth';
import { Project } from '@/types/firebase';

export function GeneratedVideosSection() {
  const { user } = useSession();
  const { 
    projects, 
    isLoading, 
    error, 
    fetchProjectsForDashboard 
  } = useProjectsStore();

  useEffect(() => {
    if (user?.id) {
      fetchProjectsForDashboard(user.id, 10);
    }
  }, [user?.id, fetchProjectsForDashboard]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'rendering':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'ready':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'rendering':
        return 'Rendering';
      case 'failed':
        return 'Failed';
      case 'ready':
        return 'Ready';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-6'>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            <span className='ml-3 text-default-500'>Loading projects...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-6'>
          <div className='text-center py-8'>
            <p className='text-danger mb-4'>{error}</p>
            <Button 
              color='primary' 
              onClick={() => user?.id && fetchProjectsForDashboard(user.id)}
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='bg-content1/60 border border-default-100'>
      <CardBody className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-foreground'>
              Generated Videos
            </h2>
            <p className='text-default-500 mt-1'>
              Your UGC video projects and renders
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              isIconOnly
              variant='light'
              onClick={() => user?.id && fetchProjectsForDashboard(user.id)}
            >
              <RefreshIcon className='w-4 h-4' />
            </Button>
            <Button
              isIconOnly
              variant='light'
            >
              <SearchIcon className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <SearchIcon className='w-8 h-8 text-default-400' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              No projects yet
            </h3>
            <p className='text-default-500 mb-6'>
              Create your first UGC video project to get started
            </p>
            <Button color='primary' size='lg'>
              Create First Project
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {projects.map((project: Project) => (
              <div
                key={project.id}
                className='p-4 rounded-lg border border-default-200 bg-background/50 hover:bg-background/70 transition-colors'
              >
                <div className='aspect-video bg-default-100 rounded-lg mb-3 flex items-center justify-center'>
                  {project.status === 'complete' ? (
                    <div className='relative w-full h-full'>
                      <img
                        src={`/api/projects/${project.id}/thumbnail` || '/images/sample1.png'}
                        alt={project.title}
                        className='w-full h-full object-cover rounded-lg'
                      />
                      <Button
                        isIconOnly
                        size='sm'
                        className='absolute top-2 right-2 bg-black/50 text-white'
                      >
                        <PlayIcon className='w-4 h-4' />
                      </Button>
                    </div>
                  ) : (
                    <div className='text-center'>
                      <div className='w-12 h-12 bg-default-200 rounded-full flex items-center justify-center mx-auto mb-2'>
                        <SearchIcon className='w-6 h-6 text-default-400' />
                      </div>
                      <p className='text-sm text-default-500'>No preview</p>
                    </div>
                  )}
                </div>

                <div className='space-y-2'>
                  <div className='flex items-start justify-between'>
                    <h3 className='font-semibold text-foreground text-sm line-clamp-2'>
                      {project.title}
                    </h3>
                    <Chip
                      size='sm'
                      color={getStatusColor(project.status)}
                      variant='flat'
                    >
                      {getStatusText(project.status)}
                    </Chip>
                  </div>

                  <p className='text-xs text-default-500 line-clamp-2'>
                    {project.flow.script}
                  </p>

                  <div className='flex items-center justify-between text-xs text-default-400'>
                    <span>{formatDate(project.createdAt)}</span>
                    <span>{project.duration}s</span>
                  </div>

                  <div className='flex gap-1 pt-2'>
                    {project.status === 'complete' && (
                      <>
                        <Button size='sm' variant='light' isIconOnly>
                          <PlayIcon className='w-3 h-3' />
                        </Button>
                        <Button size='sm' variant='light' isIconOnly>
                          <DownloadIcon className='w-3 h-3' />
                        </Button>
                        <Button size='sm' variant='light' isIconOnly>
                          <ShareIcon className='w-3 h-3' />
                        </Button>
                      </>
                    )}
                    <Button size='sm' variant='light' className='ml-auto'>
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
```

#### 3. Create `components/dashboard/ProjectCard.tsx`
**Individual project display component:**

```typescript
'use client';

import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { Progress } from '@heroui/progress';

import { PlayIcon, DownloadIcon, ShareIcon, EditIcon, DeleteIcon } from '@/components/icons';
import { Project } from '@/types/firebase';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onView?: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete, onView }: ProjectCardProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'rendering':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'ready':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'rendering':
        return 'Rendering';
      case 'failed':
        return 'Failed';
      case 'ready':
        return 'Ready';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'draft':
        return 0;
      case 'ready':
        return 25;
      case 'rendering':
        return 75;
      case 'complete':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <Card className='w-full'>
      <CardBody className='p-4'>
        <div className='aspect-video bg-default-100 rounded-lg mb-3 flex items-center justify-center'>
          {project.status === 'complete' ? (
            <div className='relative w-full h-full'>
              <img
                src={`/api/projects/${project.id}/thumbnail` || '/images/sample1.png'}
                alt={project.title}
                className='w-full h-full object-cover rounded-lg'
              />
              <Button
                isIconOnly
                size='sm'
                className='absolute top-2 right-2 bg-black/50 text-white'
              >
                <PlayIcon className='w-4 h-4' />
              </Button>
            </div>
          ) : (
            <div className='text-center'>
              <div className='w-16 h-16 bg-default-200 rounded-full flex items-center justify-center mx-auto mb-2'>
                <div className='w-8 h-8 bg-default-300 rounded-full'></div>
              </div>
              <p className='text-sm text-default-500'>Processing...</p>
            </div>
          )}
        </div>

        <div className='space-y-3'>
          <div className='flex items-start justify-between'>
            <h3 className='font-semibold text-foreground text-sm line-clamp-2 flex-1 mr-2'>
              {project.title}
            </h3>
            <Chip
              size='sm'
              color={getStatusColor(project.status)}
              variant='flat'
            >
              {getStatusText(project.status)}
            </Chip>
          </div>

          {project.status === 'rendering' && (
            <div className='space-y-1'>
              <div className='flex justify-between text-xs text-default-500'>
                <span>Rendering...</span>
                <span>{getProgressValue(project.status)}%</span>
              </div>
              <Progress
                size='sm'
                value={getProgressValue(project.status)}
                color='primary'
                className='w-full'
              />
            </div>
          )}

          <p className='text-xs text-default-500 line-clamp-2'>
            {project.flow.script}
          </p>

          <div className='flex items-center justify-between text-xs text-default-400'>
            <span>{formatDate(project.createdAt)}</span>
            <span>{project.duration}s • {project.usedCredits} credits</span>
          </div>

          <div className='flex gap-1 pt-2'>
            {project.status === 'complete' && (
              <>
                <Button size='sm' variant='light' isIconOnly>
                  <PlayIcon className='w-3 h-3' />
                </Button>
                <Button size='sm' variant='light' isIconOnly>
                  <DownloadIcon className='w-3 h-3' />
                </Button>
                <Button size='sm' variant='light' isIconOnly>
                  <ShareIcon className='w-3 h-3' />
                </Button>
              </>
            )}
            
            <div className='flex gap-1 ml-auto'>
              <Button 
                size='sm' 
                variant='light' 
                isIconOnly
                onPress={() => onEdit?.(project)}
              >
                <EditIcon className='w-3 h-3' />
              </Button>
              <Button 
                size='sm' 
                variant='light' 
                isIconOnly
                color='danger'
                onPress={() => onDelete?.(project.id)}
              >
                <DeleteIcon className='w-3 h-3' />
              </Button>
              <Button 
                size='sm' 
                variant='light'
                onPress={() => onView?.(project)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
```

#### 4. Create `components/dashboard/RenderStatus.tsx`
**Render progress tracking component:**

```typescript
'use client';

import { Card, CardBody } from '@heroui/card';
import { Progress } from '@heroui/progress';
import { Chip } from '@heroui/chip';

import { Render } from '@/types/firebase';

interface RenderStatusProps {
  renders: Render[];
  projectId: string;
}

export function RenderStatus({ renders, projectId }: RenderStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'queued':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Complete';
      case 'running':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'queued':
        return 'Queued';
      default:
        return status;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'queued':
        return 0;
      case 'running':
        return 50;
      case 'succeeded':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  const getRenderTypeText = (kind: string) => {
    switch (kind) {
      case 'tts':
        return 'Text-to-Speech';
      case 'avatar':
        return 'Avatar Generation';
      case 'final':
        return 'Final Video';
      default:
        return kind;
    }
  };

  if (renders.length === 0) {
    return (
      <Card className='w-full'>
        <CardBody className='p-4'>
          <div className='text-center py-4'>
            <p className='text-sm text-default-500'>No renders yet</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardBody className='p-4'>
        <h3 className='font-semibold text-foreground mb-3'>Render Status</h3>
        <div className='space-y-3'>
          {renders.map((render) => (
            <div key={render.id} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-foreground'>
                  {getRenderTypeText(render.kind)}
                </span>
                <Chip
                  size='sm'
                  color={getStatusColor(render.status)}
                  variant='flat'
                >
                  {getStatusText(render.status)}
                </Chip>
              </div>
              
              {render.status === 'running' && (
                <div className='space-y-1'>
                  <div className='flex justify-between text-xs text-default-500'>
                    <span>Processing...</span>
                    <span>{getProgressValue(render.status)}%</span>
                  </div>
                  <Progress
                    size='sm'
                    value={getProgressValue(render.status)}
                    color='primary'
                    className='w-full'
                  />
                </div>
              )}

              {render.error && (
                <div className='text-xs text-danger bg-danger-50 p-2 rounded'>
                  Error: {render.error}
                </div>
              )}

              <div className='text-xs text-default-400'>
                Model: {render.model} • ID: {render.providerJobId}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
```

### Integration with Existing UGC System

#### 5. Update `lib/ugc-store.ts`
**Add project creation after successful video generation:**

```typescript
// Add to existing UGC store
import { useProjectsStore } from './projects-store';

// Add to UGCState interface
interface UGCState {
  // ... existing properties
  currentProject: Project | null;
}

// Add to store actions
const handleGenerate = async () => {
  if (!isAllStepsCompleted()) return;

  setIsGenerating(true);
  try {
    // TODO: Implement actual video generation API call
    console.log('Generating video with config:', videoConfig);

    // Create project after successful generation
    if (user?.id) {
      const projectData = {
        title: `UGC Video ${Date.now()}`,
        flow: {
          script: videoConfig.audio.text,
          voiceId: videoConfig.audio.voice,
          avatarId: videoConfig.character.avatarId || 'default',
        },
        duration: videoConfig.action.duration,
      };

      const { createProject } = useProjectsStore.getState();
      const newProject = await createProject(user.id, projectData);
      
      // Update UGC store with new project
      set({ currentProject: newProject });
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    handleClose();
  } catch (error) {
    console.error('Error generating video:', error);
  } finally {
    setIsGenerating(false);
  }
};
```

#### 6. Update `app/dashboard/UGCDashboardClient.tsx`
**Integrate projects store with dashboard:**

```typescript
// Add to existing imports
import { useProjectsStore } from '@/lib/projects-store';

// Add to component
export function UGCDashboardClient() {
  const router = useRouter();
  const { user, isLoading } = useSession();
  const { fetchCredits } = useCreditsStore();
  const { fetchProjectsForDashboard } = useProjectsStore();

  // Load credits and projects on component mount
  useEffect(() => {
    if (user?.id) {
      fetchCredits();
      fetchProjectsForDashboard(user.id, 10);
    }
  }, [user?.id, fetchCredits, fetchProjectsForDashboard]);

  // ... rest of component remains the same
}
```

### Real-time Updates

#### 7. Create `lib/projects-realtime.ts`
**Real-time project and render status updates:**

```typescript
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '@/types/firebase';
import { useProjectsStore } from './projects-store';

export function subscribeToProjectUpdates(userId: string, projectId: string) {
  const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
  
  return onSnapshot(projectRef, (doc) => {
    if (doc.exists()) {
      const project = { id: doc.id, ...doc.data() };
      useProjectsStore.getState().setCurrentProject(project);
    }
  });
}

export function subscribeToRenderUpdates(userId: string, projectId: string) {
  const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
  
  return onSnapshot(rendersRef, (snapshot) => {
    const renders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    
    // Update renders in store
    // Note: This would need to be implemented in the store
  });
}

export function subscribeToUserProjects(userId: string, limit: number = 10) {
  const projectsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS);
  
  return onSnapshot(projectsRef, (snapshot) => {
    const projects = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
    
    // Update projects in store
    useProjectsStore.setState({ projects });
  });
}
```

### Testing Strategy

#### 8. Component Testing
**Test files for UI components:**

```typescript
// Example test for GeneratedVideosSection
describe('GeneratedVideosSection', () => {
  it('should display projects when available', () => {
    // Test implementation
  });

  it('should show loading state', () => {
    // Test implementation
  });

  it('should show empty state when no projects', () => {
    // Test implementation
  });

  it('should handle error state', () => {
    // Test implementation
  });
});
```

## Integration Checklist

### Phase 2B Completion Checklist

- [ ] **State Management**
  - [ ] Projects store implemented with all CRUD operations
  - [ ] Real-time updates configured
  - [ ] Error handling and loading states implemented

- [ ] **UI Components**
  - [ ] GeneratedVideosSection updated to use real project data
  - [ ] ProjectCard component created and styled
  - [ ] RenderStatus component created for progress tracking
  - [ ] All components responsive and accessible

- [ ] **Integration**
  - [ ] UGC store updated to create projects after generation
  - [ ] Dashboard client integrated with projects store
  - [ ] Real-time updates working for project status changes

- [ ] **Testing**
  - [ ] All components tested with real data
  - [ ] Error states tested
  - [ ] Loading states tested
  - [ ] Real-time updates tested

## Next Steps
After completing Phase 2B:
1. Test all UI components with real API data
2. Verify real-time updates work correctly
3. Test error handling and edge cases