import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getAvatarTemplates, createAvatarTemplate } from '@/lib/templates';
import { CreateAvatarTemplateData } from '@/types/templates';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const orderBy = searchParams.get('orderBy') || 'created_at';
    const orderDirection = searchParams.get('orderDirection') || 'desc';
    const gender = searchParams.get('gender') as 'male' | 'female' | 'neutral' | null;
    const category = searchParams.get('category');
    const isPublic = searchParams.get('is_public');
    const userId = searchParams.get('user_id');

    // Build filters
    const filters: any = {};
    if (gender) filters.gender = gender;
    if (category) filters.category = category;
    if (isPublic !== null) filters.is_public = isPublic === 'true';
    if (userId) filters.user_id = userId;

    // Get templates
    const templates = await getAvatarTemplates({
      limit,
      offset,
      orderBy: orderBy as any,
      orderDirection: orderDirection as 'asc' | 'desc',
      filters
    });

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length
    });

  } catch (error) {
    console.error('Error getting templates:', error);
    return NextResponse.json(
      { error: 'Failed to get templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['avatar_name', 'storage_url', 'category', 'gender', 'file_name', 'file_size'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Prepare template data
    const templateData: CreateAvatarTemplateData = {
      avatar_name: body.avatar_name,
      storage_url: body.storage_url,
      category: body.category,
      gender: body.gender,
      is_public: body.is_public ?? false,
      user_id: body.user_id || decodedToken.uid, // Default to current user
      file_name: body.file_name,
      file_size: body.file_size,
      upload_source: body.upload_source || 'user', // Default to user uploads
    };

    // Create template
    const templateId = await createAvatarTemplate(templateData);

    return NextResponse.json({
      success: true,
      data: { id: templateId },
      message: 'Template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
} 