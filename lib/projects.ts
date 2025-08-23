import {
  doc,
  collection,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, COLLECTIONS } from '@/types/firebase';
import { CreateProjectData, UpdateProjectData, ProjectStatus } from '@/types/projects';

export async function createProject(userId: string, projectData: CreateProjectData): Promise<Project> {
  try {
    const projectRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS);
    const newProject = {
      ...projectData,
      status: "draft" as const,
      usedCredits: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(projectRef, newProject);
    return { id: docRef.id, ...newProject } as Project;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
}

export async function getUserProjects(userId: string, limitCount: number = 50): Promise<Project[]> {
  try {
    const projectsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS);
    const projectsQuery = query(
      projectsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(projectsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  } catch (error) {
    console.error('Error getting user projects:', error);
    return [];
  }
}

export async function getUserProjectsForDashboard(userId: string, limitCount: number = 10): Promise<Project[]> {
  try {
    const projectsRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS);
    const projectsQuery = query(
      projectsRef,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    
    const snapshot = await getDocs(projectsQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Project[];
  } catch (error) {
    console.error('Error getting user projects for dashboard:', error);
    return [];
  }
}

export async function getProject(userId: string, projectId: string): Promise<Project | null> {
  try {
    const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
    const projectDoc = await getDoc(projectRef);
    
    if (projectDoc.exists()) {
      return { id: projectDoc.id, ...projectDoc.data() } as Project;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
}

export async function updateProjectStatus(userId: string, projectId: string, status: ProjectStatus): Promise<void> {
  try {
    const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
    await updateDoc(projectRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    throw error;
  }
}

export async function updateProject(userId: string, projectId: string, data: UpdateProjectData): Promise<void> {
  try {
    const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
    await updateDoc(projectRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
}

export async function deleteProject(userId: string, projectId: string): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    // Delete all renders in the project
    const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
    const rendersSnapshot = await getDocs(rendersRef);
    
    rendersSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    // Delete the project
    const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
    batch.delete(projectRef);
    
    await batch.commit();
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
} 