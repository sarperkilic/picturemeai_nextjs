import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { createProject, getUserProjects } from '@/lib/projects';
import { CreateProjectData } from '@/types/projects';
import { validateCreateProjectData } from '@/lib/api-validation';

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

    const response = NextResponse.json({
      success: true,
      projects,
    });
    
    // User-specific data - disable CDN caching, let SWR handle it
    response.headers.set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    return response;
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
    if (!validateCreateProjectData(body)) {
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