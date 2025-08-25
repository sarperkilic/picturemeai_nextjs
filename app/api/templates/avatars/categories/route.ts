import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    await adminAuth.verifyIdToken(token);
    
    // Get all avatar templates to extract unique categories
    const templatesRef = adminDb.collection('templates').doc('avatars').collection('avatars');
    const snapshot = await templatesRef.get();
    
    const categories = new Set<string>();
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    // Convert Set to array and sort
    const categoriesArray = Array.from(categories).sort();
    
    // Add default categories if none exist
    if (categoriesArray.length === 0) {
      categoriesArray.push(
        'Car Talk',
        'Podcast', 
        'Indoor',
        'Outdoor',
        'Professional',
        'Casual'
      );
    }
    
    return NextResponse.json({
      success: true,
      data: categoriesArray,
    });

  } catch (error) {
    console.error('Error getting avatar categories:', error);
    return NextResponse.json(
      { error: 'Failed to get avatar categories' },
      { status: 500 }
    );
  }
} 