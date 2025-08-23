# Projects and Renders Database Implementation

## Feature Description
Extend the existing Firebase Firestore database schema to support UGC video projects and renders. Projects are nested under users with subcollections for renders, enabling strict per-user hierarchies and collection-group queries for cross-project analytics.

## Technical Requirements

### Database Schema Changes

**New Collections Structure:**
```
users/{uid}
├── projects/{projectId} (subcollection)
│   ├── renders/{renderId} (subcollection)
│   └── renders/{renderId} (subcollection)
└── projects/{projectId} (subcollection)
```

**Project Document Schema:**
```typescript
interface Project {
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
```

**Render Document Schema:**
```typescript
interface Render {
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
```

### Files to Create/Modify

**Phase 1: Data Layer (Types and Database Operations)**

**New Type Definitions:**
- `types/firebase.ts` - Add Project and Render interfaces
- `types/projects.ts` - Project-specific types and enums

**Database Operations:**
- `lib/projects.ts` - Project CRUD operations
- `lib/renders.ts` - Render CRUD operations
- `lib/firebase-admin.ts` - Admin SDK operations for server-side

**Phase 2A: API Layer**
- `app/api/projects/route.ts` - Project management endpoints
- `app/api/projects/[projectId]/route.ts` - Individual project operations
- `app/api/projects/[projectId]/renders/route.ts` - Render management endpoints
- `app/api/projects/[projectId]/renders/[renderId]/route.ts` - Individual render operations

**Phase 2B: Client-Side Integration**
- `lib/projects-store.ts` - Zustand store for project state management
- `components/dashboard/ProjectsSection.tsx` - Project listing and management
- `components/dashboard/ProjectCard.tsx` - Individual project display
- `components/dashboard/RenderStatus.tsx` - Render progress tracking
- `components/dashboard/GeneratedVideosSection.tsx` - Update to fetch and display real projects from `users/{uid}/projects/`

### Database Operations Implementation

**Project Operations (`lib/projects.ts`):**
```typescript
// Create new project
export async function createProject(userId: string, projectData: Partial<Project>)

// Get user's projects
export async function getUserProjects(userId: string, limit?: number)

// Get single project with renders
export async function getProject(userId: string, projectId: string)

// Update project status
export async function updateProjectStatus(userId: string, projectId: string, status: ProjectStatus)

// Delete project and all renders
export async function deleteProject(userId: string, projectId: string)

// Get user's projects for dashboard display (optimized for GeneratedVideosSection)
export async function getUserProjectsForDashboard(userId: string, limit: number = 10)
```

**Render Operations (`lib/renders.ts`):**
```typescript
// Create new render
export async function createRender(userId: string, projectId: string, renderData: Partial<Render>)

// Get project renders
export async function getProjectRenders(userId: string, projectId: string)

// Update render status
export async function updateRenderStatus(userId: string, projectId: string, renderId: string, status: RenderStatus)

// Get render by ID
export async function getRender(userId: string, projectId: string, renderId: string)
```

### Collection-Group Query Support

**Cross-Project Analytics (`lib/analytics.ts`):**
```typescript
// Get all failed renders across all projects (last 24h)
export async function getFailedRendersLast24h()

// Get all renders by provider across all projects
export async function getRendersByProvider(provider: string)

// Get user's total render statistics
export async function getUserRenderStats(userId: string)
```

### State Management

**Projects Store (`lib/projects-store.ts`):**
```typescript
interface ProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProjects: (userId: string) => Promise<void>;
  fetchProjectsForDashboard: (userId: string, limit?: number) => Promise<void>;
  createProject: (userId: string, data: Partial<Project>) => Promise<Project>;
  updateProject: (userId: string, projectId: string, data: Partial<Project>) => Promise<void>;
  deleteProject: (userId: string, projectId: string) => Promise<void>;
}
```

### API Endpoints

**Project Management:**
- `GET /api/projects` - List user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/[projectId]` - Get project details
- `PUT /api/projects/[projectId]` - Update project
- `DELETE /api/projects/[projectId]` - Delete project

**Render Management:**
- `GET /api/projects/[projectId]/renders` - List project renders
- `POST /api/projects/[projectId]/renders` - Create new render
- `GET /api/projects/[projectId]/renders/[renderId]` - Get render details
- `PUT /api/projects/[projectId]/renders/[renderId]` - Update render status

### Integration with Existing UGC System

**UGC Store Updates (`lib/ugc-store.ts`):**
- Add project creation after successful video generation
- Link generated videos to projects
- Track render progress in real-time

**Dashboard Integration:**
- Replace mock video data with actual project data
- Add project management interface
- Display render progress and status

**Generated Videos Section Updates (`components/dashboard/GeneratedVideosSection.tsx`):**
- Query `users/{uid}/projects/` collection to fetch user's projects
- Display projects as generated videos in the dashboard
- Show project status, title, and creation date
- Link to project details and render status
- Replace mock video data with real project data from Firestore
- Handle empty state when user has no projects
- Implement real-time updates for project status changes

### Security Rules

**Firestore Security Rules:**
```javascript
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
```

### Migration Strategy

**Phase 1: Data Layer (Sequential)**
1. Update type definitions
2. Implement database operations
3. Add security rules
4. Create migration scripts for existing data

**Phase 2A: API Layer (Parallel)**
1. Implement project management endpoints
2. Implement render management endpoints
3. Add authentication and validation

**Phase 2B: Client Integration (Parallel)**
1. Create projects store
2. Build project management UI components
3. Integrate with existing UGC dashboard

**Phase 3: Analytics (Sequential)**
1. Implement collection-group queries
2. Add analytics dashboard
3. Performance optimization

### Error Handling

**Database Operations:**
- Handle Firestore permission errors
- Implement retry logic for failed operations
- Log errors for debugging

**API Endpoints:**
- Validate user permissions
- Handle malformed requests
- Return appropriate HTTP status codes

**Client-Side:**
- Show loading states during operations
- Display error messages to users
- Implement optimistic updates with rollback

### Performance Considerations

**Query Optimization:**
- Use composite indexes for complex queries
- Implement pagination for large datasets
- Cache frequently accessed data

**Real-time Updates:**
- Use Firestore listeners for render status updates
- Implement debounced updates to prevent excessive writes
- Optimize listener cleanup

### Testing Strategy

**Unit Tests:**
- Database operation functions
- API endpoint handlers
- State management logic

**Integration Tests:**
- End-to-end project creation flow
- Render status updates
- Collection-group queries

**Performance Tests:**
- Large dataset handling
- Concurrent user operations
- Real-time update performance 