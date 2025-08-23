# Phase 1 Implementation: Data Layer - Projects and Renders Database

## Overview
Phase 1 implements the foundational data layer for the projects and renders database feature, including type definitions, database operations, and security rules. This phase establishes the database schema and core functionality needed for subsequent phases.


## Files Created/Modified

### New Type Definitions

#### 1. Update `types/firebase.ts`
**Add Project and Render interfaces to existing Firebase types:**

```typescript
// Add to existing types/firebase.ts
export interface Project {
  id: string;
  title: string;
  status: "draft" | "ready" | "rendering" | "complete" | "failed";
  duration: number;
  flow: {
    script: string;
    voiceId: string;
    avatarId: string;
  };
  usedCredits: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Render {
  id: string;
  kind: "tts" | "avatar" | "final";
  model: string;
  providerJobId: string;
  status: "queued" | "running" | "succeeded" | "failed";
  input: Record<string, any>;
  output: Record<string, any>;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Add to COLLECTIONS constant
export const COLLECTIONS = {
  USERS: 'users',
  PURCHASES: 'purchases',
  GENERATIONS: 'generations',
  PROJECTS: 'projects', // New
  RENDERS: 'renders',   // New
} as const;
```

#### 2. Create `types/projects.ts`
**Project-specific types and enums:**

```typescript
export type ProjectStatus = "draft" | "ready" | "rendering" | "complete" | "failed";
export type RenderKind = "tts" | "avatar" | "final";
export type RenderStatus = "queued" | "running" | "succeeded" | "failed";

export interface CreateProjectData {
  title: string;
  flow: {
    script: string;
    voiceId: string;
    avatarId: string;
  };
  duration?: number;
}

export interface UpdateProjectData {
  title?: string;
  status?: ProjectStatus;
  duration?: number;
  flow?: {
    script?: string;
    voiceId?: string;
    avatarId?: string;
  };
  usedCredits?: number;
}

export interface CreateRenderData {
  kind: RenderKind;
  model: string;
  providerJobId: string;
  input: Record<string, any>;
}

export interface UpdateRenderData {
  status?: RenderStatus;
  output?: Record<string, any>;
  error?: string;
}
```

### Database Operations

#### 3. Create `lib/projects.ts`
**Project CRUD operations:**

```typescript
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
```

#### 4. Create `lib/renders.ts`
**Render CRUD operations:**

```typescript
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
```

#### 5. Update `lib/firebase-admin.ts`
**Add admin SDK operations for server-side:**

```typescript
// Add to existing lib/firebase-admin.ts
import { collectionGroup } from 'firebase-admin/firestore';

// Collection-group query for analytics
export async function getFailedRendersLast24h() {
  try {
    const rendersRef = collectionGroup(adminDb, COLLECTIONS.RENDERS);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const query = rendersRef
      .where('status', '==', 'failed')
      .where('createdAt', '>=', twentyFourHoursAgo)
      .orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting failed renders:', error);
    return [];
  }
}

export async function getRendersByProvider(provider: string) {
  try {
    const rendersRef = collectionGroup(adminDb, COLLECTIONS.RENDERS);
    const query = rendersRef
      .where('model', '==', provider)
      .orderBy('createdAt', 'desc');
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting renders by provider:', error);
    return [];
  }
}
```

### Security Rules

#### 6. Create Firestore Security Rules
**Add to your Firebase console or firestore.rules file:**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing rules for users, purchases, generations...
    
    // Users can only access their own projects
    match /users/{userId}/projects/{projectId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Users can only access renders within their projects
      match /renders/{renderId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Collection-group queries for analytics (admin only)
    match /{path=**}/renders/{renderId} {
      allow read: if request.auth != null && 
        get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.tier == "admin";
    }
  }
}
```

### Migration Scripts

#### 7. Create `scripts/migrate-projects.ts`
**Migration script for existing data (if needed):**

```typescript
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function migrateExistingGenerationsToProjects() {
  try {
    console.log('Starting migration of existing generations to projects...');
    
    // Get all generations
    const generationsRef = adminDb.collection('generations');
    const snapshot = await generationsRef.get();
    
    console.log(`Found ${snapshot.size} generations to migrate`);
    
    const batch = adminDb.batch();
    let migratedCount = 0;
    
    for (const doc of snapshot.docs) {
      const generationData = doc.data();
      
      // Create project from generation
      const projectRef = adminDb
        .collection('users')
        .doc(generationData.userId)
        .collection('projects')
        .doc();
      
      const projectData = {
        title: `Generated Video ${migratedCount + 1}`,
        status: 'complete',
        duration: 15, // Default duration
        flow: {
          script: generationData.prompt || '',
          voiceId: 'default',
          avatarId: 'default',
        },
        usedCredits: generationData.creditsUsed || 1,
        createdAt: generationData.createdAt || FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      batch.set(projectRef, projectData);
      migratedCount++;
    }
    
    await batch.commit();
    console.log(`Successfully migrated ${migratedCount} generations to projects`);
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateExistingGenerationsToProjects()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}
```

## Testing Strategy

### Unit Tests
- Test all database operation functions
- Verify error handling and edge cases
- Test security rules with different user scenarios

### Integration Tests
- Test project creation and deletion flow
- Test render status updates
- Test collection-group queries

## Next Steps
After completing Phase 1:
1. Verify all type definitions are properly exported
2. Test database operations with sample data
3. Validate security rules in Firebase console
4. Run migration script if needed
5. Proceed to Phase 2A (API Layer) implementation 