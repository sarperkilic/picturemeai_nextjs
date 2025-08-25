import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { 
  getPublicAvatarTemplates, 
  getUserAvatarTemplates, 
  getAvatarTemplatesByGender 
} from '@/lib/templates';

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
    const category = searchParams.get('category') as string | null;
    const search = searchParams.get('search') as string | null;
    const type = searchParams.get('type'); // 'public', 'user', 'gender'

    let templates;

    // Route based on type parameter
    switch (type) {
      case 'user':
        // Get user's own avatars
        templates = await getUserAvatarTemplates(decodedToken.uid, {
          limit,
          offset,
          orderBy: orderBy as any,
          orderDirection: orderDirection as 'asc' | 'desc',
        });
        break;
      
      case 'gender':
        // Get avatars by gender (public only)
        if (!gender) {
          return NextResponse.json(
            { error: 'Gender parameter required for gender type' },
            { status: 400 }
          );
        }
        templates = await getAvatarTemplatesByGender(gender, {
          limit,
          offset,
          orderBy: orderBy as any,
          orderDirection: orderDirection as 'asc' | 'desc',
        });
        break;
      
      case 'public':
      default:
        // Get public avatars (default)
        templates = await getPublicAvatarTemplates({
          limit,
          offset,
          orderBy: orderBy as any,
          orderDirection: orderDirection as 'asc' | 'desc',
        });
        break;
    }

    // Apply additional client-side filtering for search and category
    if (search || category) {
      templates = templates.filter(template => {
        let matches = true;
        
        if (search) {
          const searchLower = search.toLowerCase();
          matches = matches && (
            template.avatar_name.toLowerCase().includes(searchLower) ||
            template.category.toLowerCase().includes(searchLower)
          );
        }
        
        if (category) {
          matches = matches && template.category === category;
        }
        
        return matches;
      });
    }

    return NextResponse.json({
      success: true,
      data: templates,
      count: templates.length,
      type: type || 'public'
    });

  } catch (error) {
    console.error('Error getting avatar templates:', error);
    return NextResponse.json(
      { error: 'Failed to get avatar templates' },
      { status: 500 }
    );
  }
} 