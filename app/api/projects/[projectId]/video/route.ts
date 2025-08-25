import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/types/firebase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    const { projectId } = await params;

    // Get the project to verify ownership
    // Projects are stored as subcollections under users: users/{userId}/projects/{projectId}
    const projectDoc = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(decodedToken.uid)
      .collection(COLLECTIONS.PROJECTS)
      .doc(projectId)
      .get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();
    
    // Since we're already querying under the user's collection, 
    // the project belongs to this user by definition
    if (!projectData) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if project is complete
    if (projectData?.status !== 'complete') {
      return NextResponse.json(
        { error: 'Video not ready yet' },
        { status: 400 }
      );
    }

    // Get the final render (avatar render) for this project
    // Renders are stored as subcollections under projects: users/{userId}/projects/{projectId}/renders/{renderId}
    const rendersSnapshot = await adminDb
      .collection(COLLECTIONS.USERS)
      .doc(decodedToken.uid)
      .collection(COLLECTIONS.PROJECTS)
      .doc(projectId)
      .collection(COLLECTIONS.RENDERS)
      .where('kind', '==', 'avatar')
      .where('status', '==', 'succeeded')
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();

    if (rendersSnapshot.empty) {
      return NextResponse.json(
        { error: 'Video render not found' },
        { status: 404 }
      );
    }

    const renderDoc = rendersSnapshot.docs[0];
    const renderData = renderDoc.data();

    // Extract video URL from render output
    const videoUrl = renderData?.output?.video?.url;
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL not available' },
        { status: 404 }
      );
    }

    // For now, return the video URL
    // In a production environment, you might want to proxy the video or serve it directly
    return NextResponse.json({
      success: true,
      data: {
        videoUrl,
        duration: renderData?.output?.duration || projectData?.duration || 0,
      },
    });

  } catch (error) {
    console.error('Error fetching video:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    );
  }
} 