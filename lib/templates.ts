import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '../types/firebase';
import {
  AvatarTemplate,
  CreateAvatarTemplateData,
  UpdateAvatarTemplateData,
  AvatarTemplateFilters,
  AvatarTemplateQueryOptions,
} from '../types/templates';

/**
 * Create a new avatar template
 */
export async function createAvatarTemplate(
  data: CreateAvatarTemplateData
): Promise<string> {
  try {
    const now = Timestamp.now();
    const templateData = {
      ...data,
      user_id: data.user_id || null,
      created_at: now,
      updated_at: now,
    };

    const docRef = await addDoc(
      collection(db, COLLECTIONS.TEMPLATES, 'avatars', 'avatars'),
      templateData
    );

    return docRef.id;
  } catch (error) {
    console.error('Error creating avatar template:', error);
    throw new Error(`Failed to create avatar template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get an avatar template by ID
 */
export async function getAvatarTemplate(id: string): Promise<AvatarTemplate | null> {
  try {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, 'avatars', 'avatars', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as AvatarTemplate;
    }

    return null;
  } catch (error) {
    console.error('Error getting avatar template:', error);
    throw new Error(`Failed to get avatar template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update an avatar template
 */
export async function updateAvatarTemplate(
  id: string,
  data: UpdateAvatarTemplateData
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, 'avatars', 'avatars', id);
    const updateData = {
      ...data,
      updated_at: Timestamp.now(),
    };

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating avatar template:', error);
    throw new Error(`Failed to update avatar template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete an avatar template
 */
export async function deleteAvatarTemplate(id: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.TEMPLATES, 'avatars', 'avatars', id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting avatar template:', error);
    throw new Error(`Failed to delete avatar template: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get avatar templates with filtering and pagination
 */
export async function getAvatarTemplates(
  options: AvatarTemplateQueryOptions = {}
): Promise<AvatarTemplate[]> {
  try {
    const { limit: limitCount = 50, orderBy: orderByField = 'created_at', orderDirection = 'desc', filters } = options;

    const collectionRef = collection(db, COLLECTIONS.TEMPLATES, 'avatars', 'avatars');
    const constraints: any[] = [];

    // Apply filters
    if (filters) {
      if (filters.gender) {
        constraints.push(where('gender', '==', filters.gender));
      }
      if (filters.category) {
        constraints.push(where('category', '==', filters.category));
      }
      if (filters.is_public !== undefined) {
        constraints.push(where('is_public', '==', filters.is_public));
      }
      if (filters.user_id) {
        constraints.push(where('user_id', '==', filters.user_id));
      }
    }

    // Apply ordering and limit
    constraints.push(orderBy(orderByField, orderDirection));
    constraints.push(limit(limitCount));

    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    const templates: AvatarTemplate[] = [];

    querySnapshot.forEach((doc) => {
      templates.push({ id: doc.id, ...doc.data() } as AvatarTemplate);
    });

    return templates;
  } catch (error) {
    console.error('Error getting avatar templates:', error);
    throw new Error(`Failed to get avatar templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get public avatar templates
 */
export async function getPublicAvatarTemplates(
  options: Omit<AvatarTemplateQueryOptions, 'filters'> = {}
): Promise<AvatarTemplate[]> {
  return getAvatarTemplates({
    ...options,
    filters: { is_public: true },
  });
}

/**
 * Get user's avatar templates
 */
export async function getUserAvatarTemplates(
  userId: string,
  options: Omit<AvatarTemplateQueryOptions, 'filters'> = {}
): Promise<AvatarTemplate[]> {
  return getAvatarTemplates({
    ...options,
    filters: { user_id: userId },
  });
}

/**
 * Get avatar templates by gender
 */
export async function getAvatarTemplatesByGender(
  gender: 'male' | 'female' | 'neutral',
  options: Omit<AvatarTemplateQueryOptions, 'filters'> = {}
): Promise<AvatarTemplate[]> {
  return getAvatarTemplates({
    ...options,
    filters: { gender, is_public: true },
  });
}

/**
 * Create multiple avatar templates in a batch
 */
export async function createAvatarTemplatesBatch(
  templates: CreateAvatarTemplateData[]
): Promise<string[]> {
  try {
    const batch = writeBatch(db);
    const ids: string[] = [];
    const now = Timestamp.now();

    templates.forEach((template) => {
      const docRef = doc(collection(db, COLLECTIONS.TEMPLATES, 'avatars', 'avatars'));
      const templateData = {
        ...template,
        user_id: template.user_id || null,
        created_at: now,
        updated_at: now,
      };

      batch.set(docRef, templateData);
      ids.push(docRef.id);
    });

    await batch.commit();
    return ids;
  } catch (error) {
    console.error('Error creating avatar templates batch:', error);
    throw new Error(`Failed to create avatar templates batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Delete multiple avatar templates in a batch
 */
export async function deleteAvatarTemplatesBatch(ids: string[]): Promise<void> {
  try {
    const batch = writeBatch(db);

    ids.forEach((id) => {
      const docRef = doc(db, COLLECTIONS.TEMPLATES, 'avatars', 'avatars', id);
      batch.delete(docRef);
    });

    await batch.commit();
  } catch (error) {
    console.error('Error deleting avatar templates batch:', error);
    throw new Error(`Failed to delete avatar templates batch: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 