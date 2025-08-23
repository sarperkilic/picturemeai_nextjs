import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getProject, updateProjectStatus } from '@/lib/projects';
import { ProjectStatus } from '@/types/projects';
import { validateProjectStatus } from '@/lib/api-validation';

interface RouteParams {
  params: Promise<{
    projectId: string;
  }>;
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId } = await params;
    const userId = session.user.id;
    const { status }: { status: ProjectStatus } = await request.json();

    // Validate status
    if (!validateProjectStatus(status)) {
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