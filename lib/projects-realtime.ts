import { onSnapshot, doc, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '@/types/firebase';
import { Project, Render } from '@/types/firebase';
import { useProjectsStore } from './projects-store';

export interface ProjectUpdateCallback {
  (project: Project | null, renders: Render[]): void;
}

export interface ProjectsUpdateCallback {
  (projects: Project[]): void;
}

/**
 * Subscribe to real-time updates for a specific project and its renders
 */
export function subscribeToProjectUpdates(
  userId: string,
  projectId: string,
  onUpdate: ProjectUpdateCallback
) {
  // Subscribe to project changes
  const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
  const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
  
  const unsubscribeProject = onSnapshot(projectRef, (doc) => {
    const project = doc.exists() ? { id: doc.id, ...doc.data() } as Project : null;
    
    // Get renders for this project
    onSnapshot(rendersRef, (rendersSnapshot) => {
      const renders = rendersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Render[];
      
      onUpdate(project, renders);
    });
  });
  
  return unsubscribeProject;
}

/**
 * Subscribe to real-time updates for all user projects
 */
export function subscribeToUserProjects(
  userId: string, 
  limitCount: number = 10,
  onUpdate: ProjectsUpdateCallback
) {
  const projectsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS);
  const projectsQuery = query(
    projectsRef,
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(projectsQuery, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
    
    onUpdate(projects);
  });
}

/**
 * Subscribe to real-time updates for projects with specific status
 */
export function subscribeToProjectsByStatus(
  userId: string,
  status: string,
  limitCount: number = 10,
  onUpdate: ProjectsUpdateCallback
) {
  const projectsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS);
  const projectsQuery = query(
    projectsRef,
    where('status', '==', status),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(projectsQuery, (snapshot) => {
    const projects = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
    
    onUpdate(projects);
  });
}

/**
 * Subscribe to real-time updates for renders of a specific project
 */
export function subscribeToProjectRenders(
  userId: string,
  projectId: string,
  onUpdate: (renders: Render[]) => void
) {
  const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
  const rendersQuery = query(rendersRef, orderBy('createdAt', 'desc'));
  
  return onSnapshot(rendersQuery, (snapshot) => {
    const renders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
    
    onUpdate(renders);
  });
}

/**
 * Subscribe to real-time updates for renders with specific status
 */
export function subscribeToRendersByStatus(
  userId: string,
  projectId: string,
  status: string,
  onUpdate: (renders: Render[]) => void
) {
  const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
  const rendersQuery = query(
    rendersRef,
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(rendersQuery, (snapshot) => {
    const renders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
    
    onUpdate(renders);
  });
}

/**
 * Subscribe to real-time updates for active renders (running or queued)
 */
export function subscribeToActiveRenders(
  userId: string,
  projectId: string,
  onUpdate: (renders: Render[]) => void
) {
  const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
  const rendersQuery = query(
    rendersRef,
    where('status', 'in', ['queued', 'running']),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(rendersQuery, (snapshot) => {
    const renders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
    
    onUpdate(renders);
  });
}

/**
 * Legacy function for backward compatibility
 */
export function subscribeToProjectUpdatesLegacy(userId: string, projectId: string) {
  const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
  
  return onSnapshot(projectRef, (doc) => {
    if (doc.exists()) {
      const project = { id: doc.id, ...doc.data() } as Project;
      useProjectsStore.getState().setCurrentProject(project);
    }
  });
}

/**
 * Legacy function for backward compatibility
 */
export function subscribeToRenderUpdatesLegacy(userId: string, projectId: string) {
  const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
  
  return onSnapshot(rendersRef, (snapshot) => {
    const renders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
    
    useProjectsStore.setState({ currentProjectRenders: renders });
  });
} 