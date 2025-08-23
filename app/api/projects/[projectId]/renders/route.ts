import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getProject } from '@/lib/projects';
import { createRender, getProjectRenders } from '@/lib/renders';
import { CreateRenderData } from '@/types/projects';
import { validateCreateRenderData } from '@/lib/api-validation';

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
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

    const { projectId } = await params;
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
    if (!validateCreateRenderData(body)) {
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