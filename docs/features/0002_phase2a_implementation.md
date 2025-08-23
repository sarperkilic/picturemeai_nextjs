# Phase 2A Implementation: API Layer - Projects and Renders Endpoints

## Overview
Phase 2A implements the REST API endpoints for project and render management. This phase creates the server-side API layer that will be consumed by the client-side components in Phase 2B.

## Files Created/Modified

### API Endpoints

#### 1. Create `app/api/projects/route.ts`
**Project management endpoints (GET, POST):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createProject, getUserProjects } from '@/lib/projects';
import { CreateProjectData } from '@/types/projects';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const userId = session.user.id;

    const projects = await getUserProjects(userId, limit);

    return NextResponse.json({
      success: true,
      projects,
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateProjectData = await request.json();
    const userId = session.user.id;

    // Validate required fields
    if (!body.title || !body.flow?.script || !body.flow?.voiceId || !body.flow?.avatarId) {
      return NextResponse.json(
        { error: 'Missing required fields: title, flow.script, flow.voiceId, flow.avatarId' },
        { status: 400 }
      );
    }

    const project = await createProject(userId, body);

    return NextResponse.json({
      success: true,
      project,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
```

#### 2. Create `app/api/projects/[projectId]/route.ts`
**Individual project operations (GET, PUT, DELETE):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getProject, updateProject, deleteProject } from '@/lib/projects';
import { UpdateProjectData } from '@/types/projects';

interface RouteParams {
  params: {
    projectId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const userId = session.user.id;

    const project = await getProject(userId, projectId);

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const userId = session.user.id;
    const body: UpdateProjectData = await request.json();

    // Check if project exists
    const existingProject = await getProject(userId, projectId);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await updateProject(userId, projectId, body);

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const userId = session.user.id;

    // Check if project exists
    const existingProject = await getProject(userId, projectId);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await deleteProject(userId, projectId);

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
```

#### 3. Create `app/api/projects/[projectId]/renders/route.ts`
**Render management endpoints (GET, POST):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getProject } from '@/lib/projects';
import { createRender, getProjectRenders } from '@/lib/renders';
import { CreateRenderData } from '@/types/projects';

interface RouteParams {
  params: {
    projectId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const userId = session.user.id;

    // Verify project exists and belongs to user
    const project = await getProject(userId, projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const renders = await getProjectRenders(userId, projectId);

    return NextResponse.json({
      success: true,
      renders,
    });
  } catch (error) {
    console.error('Error fetching renders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch renders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const userId = session.user.id;
    const body: CreateRenderData = await request.json();

    // Verify project exists and belongs to user
    const project = await getProject(userId, projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.kind || !body.model || !body.providerJobId || !body.input) {
      return NextResponse.json(
        { error: 'Missing required fields: kind, model, providerJobId, input' },
        { status: 400 }
      );
    }

    const render = await createRender(userId, projectId, body);

    return NextResponse.json({
      success: true,
      render,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating render:', error);
    return NextResponse.json(
      { error: 'Failed to create render' },
      { status: 500 }
    );
  }
}
```

#### 4. Create `app/api/projects/[projectId]/renders/[renderId]/route.ts`
**Individual render operations (GET, PUT, DELETE):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getProject } from '@/lib/projects';
import { getRender, updateRender, deleteRender } from '@/lib/renders';
import { UpdateRenderData } from '@/types/projects';

interface RouteParams {
  params: {
    projectId: string;
    renderId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, renderId } = params;
    const userId = session.user.id;

    // Verify project exists and belongs to user
    const project = await getProject(userId, projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    const render = await getRender(userId, projectId, renderId);

    if (!render) {
      return NextResponse.json(
        { error: 'Render not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      render,
    });
  } catch (error) {
    console.error('Error fetching render:', error);
    return NextResponse.json(
      { error: 'Failed to fetch render' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, renderId } = params;
    const userId = session.user.id;
    const body: UpdateRenderData = await request.json();

    // Verify project exists and belongs to user
    const project = await getProject(userId, projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if render exists
    const existingRender = await getRender(userId, projectId, renderId);
    if (!existingRender) {
      return NextResponse.json(
        { error: 'Render not found' },
        { status: 404 }
      );
    }

    await updateRender(userId, projectId, renderId, body);

    return NextResponse.json({
      success: true,
      message: 'Render updated successfully',
    });
  } catch (error) {
    console.error('Error updating render:', error);
    return NextResponse.json(
      { error: 'Failed to update render' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, renderId } = params;
    const userId = session.user.id;

    // Verify project exists and belongs to user
    const project = await getProject(userId, projectId);
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Check if render exists
    const existingRender = await getRender(userId, projectId, renderId);
    if (!existingRender) {
      return NextResponse.json(
        { error: 'Render not found' },
        { status: 404 }
      );
    }

    await deleteRender(userId, projectId, renderId);

    return NextResponse.json({
      success: true,
      message: 'Render deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting render:', error);
    return NextResponse.json(
      { error: 'Failed to delete render' },
      { status: 500 }
    );
  }
}
```

#### 5. Create `app/api/projects/[projectId]/status/route.ts`
**Project status management endpoint (PUT):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getProject, updateProjectStatus } from '@/lib/projects';
import { ProjectStatus } from '@/types/projects';

interface RouteParams {
  params: {
    projectId: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = params;
    const userId = session.user.id;
    const { status }: { status: ProjectStatus } = await request.json();

    // Validate status
    const validStatuses: ProjectStatus[] = ['draft', 'ready', 'rendering', 'complete', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be one of: draft, ready, rendering, complete, failed' },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await getProject(userId, projectId);
    if (!existingProject) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    await updateProjectStatus(userId, projectId, status);

    return NextResponse.json({
      success: true,
      message: 'Project status updated successfully',
      status,
    });
  } catch (error) {
    console.error('Error updating project status:', error);
    return NextResponse.json(
      { error: 'Failed to update project status' },
      { status: 500 }
    );
  }
}
```

#### 6. Create `app/api/analytics/renders/route.ts`
**Analytics endpoints for collection-group queries (admin only):**

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getFailedRendersLast24h, getRendersByProvider } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you may need to implement this check based on your user tier system)
    const userData = await auth.api.getUserData(session.user.id);
    if (userData?.tier !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const provider = searchParams.get('provider');

    let data;

    if (type === 'failed-last-24h') {
      data = await getFailedRendersLast24h();
    } else if (type === 'by-provider' && provider) {
      data = await getRendersByProvider(provider);
    } else {
      return NextResponse.json(
        { error: 'Invalid query parameters. Use type=failed-last-24h or type=by-provider&provider=<provider>' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
```

### Error Handling and Validation

#### 7. Create `lib/api-validation.ts`
**Shared validation utilities:**

```typescript
import { NextRequest } from 'next/server';
import { ProjectStatus, RenderKind, RenderStatus } from '@/types/projects';

export function validateProjectStatus(status: string): status is ProjectStatus {
  const validStatuses: ProjectStatus[] = ['draft', 'ready', 'rendering', 'complete', 'failed'];
  return validStatuses.includes(status as ProjectStatus);
}

export function validateRenderKind(kind: string): kind is RenderKind {
  const validKinds: RenderKind[] = ['tts', 'avatar', 'final'];
  return validKinds.includes(kind as RenderKind);
}

export function validateRenderStatus(status: string): status is RenderStatus {
  const validStatuses: RenderStatus[] = ['queued', 'running', 'succeeded', 'failed'];
  return validStatuses.includes(status as RenderStatus);
}

export function validateCreateProjectData(data: any): data is {
  title: string;
  flow: {
    script: string;
    voiceId: string;
    avatarId: string;
  };
  duration?: number;
} {
  return (
    typeof data.title === 'string' &&
    data.title.trim().length > 0 &&
    typeof data.flow === 'object' &&
    typeof data.flow.script === 'string' &&
    data.flow.script.trim().length > 0 &&
    typeof data.flow.voiceId === 'string' &&
    data.flow.voiceId.trim().length > 0 &&
    typeof data.flow.avatarId === 'string' &&
    data.flow.avatarId.trim().length > 0 &&
    (data.duration === undefined || typeof data.duration === 'number')
  );
}

export function validateCreateRenderData(data: any): data is {
  kind: RenderKind;
  model: string;
  providerJobId: string;
  input: Record<string, any>;
} {
  return (
    validateRenderKind(data.kind) &&
    typeof data.model === 'string' &&
    data.model.trim().length > 0 &&
    typeof data.providerJobId === 'string' &&
    data.providerJobId.trim().length > 0 &&
    typeof data.input === 'object' &&
    data.input !== null
  );
}
```

### Testing Strategy

#### 8. Create API Tests
**Test files for each endpoint:**

```typescript
// Example test structure for projects API
describe('Projects API', () => {
  describe('GET /api/projects', () => {
    it('should return user projects when authenticated', async () => {
      // Test implementation
    });

    it('should return 401 when not authenticated', async () => {
      // Test implementation
    });
  });

  describe('POST /api/projects', () => {
    it('should create project with valid data', async () => {
      // Test implementation
    });

    it('should return 400 with invalid data', async () => {
      // Test implementation
    });
  });
});
```

## API Documentation

### Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/projects` | List user's projects | Yes |
| POST | `/api/projects` | Create new project | Yes |
| GET | `/api/projects/[projectId]` | Get project details | Yes |
| PUT | `/api/projects/[projectId]` | Update project | Yes |
| DELETE | `/api/projects/[projectId]` | Delete project | Yes |
| PUT | `/api/projects/[projectId]/status` | Update project status | Yes |
| GET | `/api/projects/[projectId]/renders` | List project renders | Yes |
| POST | `/api/projects/[projectId]/renders` | Create new render | Yes |
| GET | `/api/projects/[projectId]/renders/[renderId]` | Get render details | Yes |
| PUT | `/api/projects/[projectId]/renders/[renderId]` | Update render | Yes |
| DELETE | `/api/projects/[projectId]/renders/[renderId]` | Delete render | Yes |
| GET | `/api/analytics/renders` | Get render analytics | Admin only |

### Request/Response Examples

**Create Project:**
```json
POST /api/projects
{
  "title": "My UGC Video",
  "flow": {
    "script": "Welcome to our product demo...",
    "voiceId": "voice_123",
    "avatarId": "avatar_456"
  },
  "duration": 15
}
```

**Update Project Status:**
```json
PUT /api/projects/[projectId]/status
{
  "status": "rendering"
}
```

**Create Render:**
```json
POST /api/projects/[projectId]/renders
{
  "kind": "tts",
  "model": "elevenlabs",
  "providerJobId": "job_789",
  "input": {
    "text": "Welcome to our product demo...",
    "voice": "voice_123"
  }
}
```

## Next Steps
After completing Phase 2A:
1. Test all API endpoints with Postman or similar tool
2. Verify authentication and authorization work correctly
3. Test error handling and validation
4. Document API endpoints for frontend team