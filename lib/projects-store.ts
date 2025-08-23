import { create } from 'zustand';
import { Project, Render } from '@/types/firebase';
import { CreateProjectData, UpdateProjectData, CreateRenderData, UpdateRenderData } from '@/types/projects';
import { FirebaseAuthClient } from './firebase-auth';

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
      const response = await FirebaseAuthClient.authenticatedRequest('/api/projects');
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
      const response = await FirebaseAuthClient.authenticatedRequest(`/api/projects?limit=${limit}`);
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
      const response = await FirebaseAuthClient.authenticatedRequest(`/api/projects/${projectId}`);
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
      const response = await FirebaseAuthClient.authenticatedRequest(`/api/projects/${projectId}/renders`);
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
      const response = await FirebaseAuthClient.authenticatedRequest('/api/projects', {
        method: 'POST',
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
      const response = await FirebaseAuthClient.authenticatedRequest(`/api/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
      const responseData = await response.json();
      
      if (responseData.success) {
        set(state => ({
          projects: state.projects.map(p => 
            p.id === projectId ? { ...p, ...data } as Project : p
          ),
          currentProject: state.currentProject?.id === projectId 
            ? { ...state.currentProject, ...data } as Project
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
      const response = await FirebaseAuthClient.authenticatedRequest(`/api/projects/${projectId}`, {
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
      const response = await FirebaseAuthClient.authenticatedRequest(`/api/projects/${projectId}/renders`, {
        method: 'POST',
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
      const response = await FirebaseAuthClient.authenticatedRequest(`/api/projects/${projectId}/renders/${renderId}`, {
        method: 'PUT',
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
      const response = await FirebaseAuthClient.authenticatedRequest(`/api/projects/${projectId}/renders/${renderId}`, {
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