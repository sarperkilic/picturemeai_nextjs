import { onSnapshot, doc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '@/types/firebase';
import { useProjectsStore } from './projects-store';

export function subscribeToProjectUpdates(userId: string, projectId: string) {
  const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
  
  return onSnapshot(projectRef, (doc) => {
    if (doc.exists()) {
      const project = { id: doc.id, ...doc.data() } as any;
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
    })) as any[];
    
    // Update renders in store
    // Note: This would need to be implemented in the store
    useProjectsStore.setState({ currentProjectRenders: renders });
  });
}

export function subscribeToUserProjects(userId: string, limit: number = 10) {
  const projectsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS);
  
  return onSnapshot(projectsRef, (snapshot) => {
    const projects = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .slice(0, limit) as any[];
    
    // Update projects in store
    useProjectsStore.setState({ projects });
  });
} 