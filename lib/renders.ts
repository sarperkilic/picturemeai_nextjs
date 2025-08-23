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
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Render, COLLECTIONS } from '@/types/firebase';
import { CreateRenderData, UpdateRenderData, RenderStatus } from '@/types/projects';

export async function createRender(userId: string, projectId: string, renderData: CreateRenderData): Promise<Render> {
  try {
    const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
    const newRender = {
      ...renderData,
      status: "queued" as const,
      output: {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(rendersRef, newRender);
    return { id: docRef.id, ...newRender } as Render;
  } catch (error) {
    console.error('Error creating render:', error);
    throw error;
  }
}

export async function getProjectRenders(userId: string, projectId: string): Promise<Render[]> {
  try {
    const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
    const rendersQuery = query(rendersRef, orderBy('createdAt', 'desc'));
    
    const snapshot = await getDocs(rendersQuery);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Render[];
  } catch (error) {
    console.error('Error getting project renders:', error);
    return [];
  }
}

export async function getRender(userId: string, projectId: string, renderId: string): Promise<Render | null> {
  try {
    const renderRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS, renderId);
    const renderDoc = await getDoc(renderRef);
    
    if (renderDoc.exists()) {
      return { id: renderDoc.id, ...renderDoc.data() } as Render;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting render:', error);
    return null;
  }
}

export async function updateRenderStatus(userId: string, projectId: string, renderId: string, status: RenderStatus): Promise<void> {
  try {
    const renderRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS, renderId);
    await updateDoc(renderRef, {
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating render status:', error);
    throw error;
  }
}

export async function updateRender(userId: string, projectId: string, renderId: string, data: UpdateRenderData): Promise<void> {
  try {
    const renderRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS, renderId);
    await updateDoc(renderRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating render:', error);
    throw error;
  }
}

export async function deleteRender(userId: string, projectId: string, renderId: string): Promise<void> {
  try {
    const renderRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS, renderId);
    await deleteDoc(renderRef);
  } catch (error) {
    console.error('Error deleting render:', error);
    throw error;
  }
} 