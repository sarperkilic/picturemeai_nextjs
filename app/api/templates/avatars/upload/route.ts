import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminStorage } from '@/lib/firebase-admin';
import { CreateAvatarTemplateData } from '@/types/templates';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Check if this is a multipart form data request (file upload)
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('file') as File;
      const avatarName = formData.get('avatar_name') as string;
      const gender = formData.get('gender') as 'male' | 'female' | 'neutral';
      const category = formData.get('category') as string;
      
      // Validate required fields
      if (!file || !avatarName || !gender || !category) {
        return NextResponse.json(
          { error: 'Missing required fields: file, avatar_name, gender, category' },
          { status: 400 }
        );
      }

      // Validate gender
      if (!['male', 'female', 'neutral'].includes(gender)) {
        return NextResponse.json(
          { error: 'Invalid gender value' },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'Invalid file type. Only JPEG, PNG, and GIF are allowed.' },
          { status: 400 }
        );
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: 'File size too large. Maximum size is 5MB.' },
          { status: 400 }
        );
      }

      // Create unique filename
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop();
      const fileName = `${avatarName}_${gender}_${decodedToken.uid}_${timestamp}.${fileExtension}`;
      const filePath = `avatars/${fileName}`;

      // Upload file to Firebase Storage
      const bucket = adminStorage.bucket();
      const fileBuffer = await file.arrayBuffer();
      
      const storageFile = bucket.file(filePath);
      await storageFile.save(Buffer.from(fileBuffer), {
        metadata: {
          contentType: file.type,
          metadata: {
            uploadedBy: decodedToken.uid,
            avatarName,
            gender,
            category,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Make file publicly accessible
      await storageFile.makePublic();
      
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      // Create template document
      const templateData = {
        avatar_name: avatarName,
        storage_url: publicUrl,
        category,
        gender,
        is_public: false, // Default to private for user uploads
        user_id: decodedToken.uid,
        file_name: fileName,
        file_size: file.size,
        upload_source: 'user' as const,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Add to Firestore
      const docRef = await adminDb.collection('templates').doc('avatars').collection('avatars').add(templateData);
      
      // Get the created document
      const doc = await docRef.get();
      const createdTemplateData = doc.data();

      return NextResponse.json({
        success: true,
        data: {
          id: doc.id,
          storage_url: createdTemplateData?.storage_url,
          avatar_name: createdTemplateData?.avatar_name,
        },
        message: 'Avatar uploaded successfully',
      });

    } else {
      // Handle JSON request (for backward compatibility)
      const body: CreateAvatarTemplateData = await request.json();
      
      // Validate required fields
      const requiredFields = ['avatar_name', 'storage_url', 'category', 'gender', 'file_name', 'file_size', 'upload_source'];
      for (const field of requiredFields) {
        if (!body[field as keyof CreateAvatarTemplateData]) {
          return NextResponse.json(
            { error: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }

      // Validate gender
      if (!['male', 'female', 'neutral'].includes(body.gender)) {
        return NextResponse.json(
          { error: 'Invalid gender value' },
          { status: 400 }
        );
      }

      // Validate upload_source
      if (!['user', 'system'].includes(body.upload_source)) {
        return NextResponse.json(
          { error: 'Invalid upload_source value' },
          { status: 400 }
        );
      }

      // Create template document
      const templateData = {
        avatar_name: body.avatar_name,
        storage_url: body.storage_url,
        category: body.category,
        gender: body.gender,
        is_public: body.is_public ?? false,
        user_id: body.user_id || decodedToken.uid,
        file_name: body.file_name,
        file_size: body.file_size,
        upload_source: body.upload_source,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Add to Firestore
      const docRef = await adminDb.collection('templates').doc('avatars').collection('avatars').add(templateData);
      
      // Get the created document
      const doc = await docRef.get();
      const template = {
        id: doc.id,
        ...doc.data(),
      };

      return NextResponse.json({
        success: true,
        data: template,
      });
    }

  } catch (error) {
    console.error('Error creating avatar template:', error);
    return NextResponse.json(
      { error: 'Failed to create avatar template' },
      { status: 500 }
    );
  }
} 