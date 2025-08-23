import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getProject } from '@/lib/projects';
import { getRender, updateRender, deleteRender } from '@/lib/renders';
import { UpdateRenderData } from '@/types/projects';

interface RouteParams {
  params: Promise<{
    projectId: string;
    renderId: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, renderId } = await params;
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

    const { projectId, renderId } = await params;
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

    const { projectId, renderId } = await params;
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