import { NextRequest, NextResponse } from 'next/server';
import { VideoGenerationService } from '@/lib/video-generation-service';
import { adminAuth } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    if (!decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { script, voiceId, avatarId, imageUrl } = body;

    // Validate required fields
    if (!script || !voiceId || !avatarId || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: script, voiceId, avatarId, imageUrl' },
        { status: 400 }
      );
    }

    // Start video generation on server side
    const result = await VideoGenerationService.generateVideoWithErrorHandling(
      decodedToken.uid,
      {
        script,
        voiceId,
        avatarId,
        imageUrl,
      },
      (message) => {
        // Log progress messages
        console.log('Video generation progress:', message);
      }
    );

    return NextResponse.json({
      success: true,
      data: {
        projectId: result.projectId,
        ttsRenderId: result.ttsRenderId,
        avatarRenderId: result.avatarRenderId,
        finalVideoUrl: result.finalVideoUrl,
        duration: result.duration,
      },
      message: 'Video generation started successfully',
    });

  } catch (error) {
    console.error('Video generation error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Video generation failed',
        success: false 
      },
      { status: 500 }
    );
  }
} 