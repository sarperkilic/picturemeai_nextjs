import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { 
  getAvatarTemplate, 
  updateAvatarTemplate, 
  deleteAvatarTemplate 
} from '@/lib/templates';
import { UpdateAvatarTemplateData } from '@/types/templates';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ avatarId: string }> }
) {
  const { avatarId } = await context.params;
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await adminAuth.verifyIdToken(token);

    // Get template
    const template = await getAvatarTemplate(avatarId);

    if (!template) {
      return NextResponse.json(
        { error: 'Avatar template not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template
    });

  } catch (error) {
    console.error('Error getting avatar template:', error);
    return NextResponse.json(
      { error: 'Failed to get avatar template' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ avatarId: string }> }
) {
  const { avatarId } = await context.params;
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Get existing template to check ownership
    const existingTemplate = await getAvatarTemplate(avatarId);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Avatar template not found' },
        { status: 404 }
      );
    }

    // Check ownership (user can only update their own templates or system avatars)
    if (existingTemplate.user_id && existingTemplate.user_id !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Forbidden: You can only update your own templates' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Prepare update data
    const updateData: UpdateAvatarTemplateData = {};
    
    if (body.avatar_name !== undefined) updateData.avatar_name = body.avatar_name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.is_public !== undefined) updateData.is_public = body.is_public;

    // Update template
    await updateAvatarTemplate(avatarId, updateData);

    return NextResponse.json({
      success: true,
      message: 'Avatar template updated successfully'
    });

  } catch (error) {
    console.error('Error updating avatar template:', error);
    return NextResponse.json(
      { error: 'Failed to update avatar template' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ avatarId: string }> }
) {
  const { avatarId } = await context.params;
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Get existing template to check ownership
    const existingTemplate = await getAvatarTemplate(avatarId);
    if (!existingTemplate) {
      return NextResponse.json(
        { error: 'Avatar template not found' },
        { status: 404 }
      );
    }

    // Check ownership (user can only delete their own templates or system avatars)
    if (existingTemplate.user_id && existingTemplate.user_id !== decodedToken.uid) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own templates' },
        { status: 403 }
      );
    }

    // Delete template
    await deleteAvatarTemplate(avatarId);

    return NextResponse.json({
      success: true,
      message: 'Avatar template deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting avatar template:', error);
    return NextResponse.json(
      { error: 'Failed to delete avatar template' },
      { status: 500 }
    );
  }
} 