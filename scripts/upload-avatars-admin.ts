#!/usr/bin/env tsx

import { readFileSync } from 'fs';
import { join } from 'path';
import { getStorage } from 'firebase-admin/storage';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { COLLECTIONS } from '../types/firebase';
import 'dotenv/config';

interface AvatarFile {
  filename: string;
  path: string;
  avatarName: string;
  gender: 'male' | 'female';
}

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
  // Try to use service account key file first, fallback to environment variables
  const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || '/Users/sarperkilic/Downloads/service-account-key.json';
  
  try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    
    console.log('✅ Using service account key file for authentication');
  } catch (error) {
    console.log('⚠️  Service account file not found, trying environment variables...');
    
    // Fallback to environment variables
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    
    console.log('✅ Using environment variables for authentication');
  }
}

const adminStorage = getStorage();
const adminDb = getFirestore();

async function uploadAvatarImages() {
  console.log('🚀 Starting Avatar Upload Process (Admin SDK)...\n');

  try {
    // Define avatar files with metadata
    const avatarFiles: AvatarFile[] = [
      {
        filename: 'paul_man.png',
        path: join(process.cwd(), 'example_avatar_images', 'paul_man.png'),
        avatarName: 'Paul',
        gender: 'male'
      },
      {
        filename: 'ashe_woman.png',
        path: join(process.cwd(), 'example_avatar_images', 'ashe_woman.png'),
        avatarName: 'Ashe',
        gender: 'female'
      },
      {
        filename: 'mark_man.png',
        path: join(process.cwd(), 'example_avatar_images', 'mark_man.png'),
        avatarName: 'Mark',
        gender: 'male'
      },
      {
        filename: 'mayra_woman.png',
        path: join(process.cwd(), 'example_avatar_images', 'mayra_woman.png'),
        avatarName: 'Mayra',
        gender: 'female'
      }
    ];

    console.log(`📁 Found ${avatarFiles.length} avatar files to upload\n`);

    const templateData: any[] = [];

    // Upload each avatar file and collect template data
    for (const avatarFile of avatarFiles) {
      try {
        console.log(`📤 Uploading ${avatarFile.filename}...`);
        
        // Read the file
        const fileBuffer = readFileSync(avatarFile.path);
        
        // Upload to Firebase Storage using Admin SDK
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ugc-video-generator-e929d.firebasestorage.app';
        const bucket = adminStorage.bucket(bucketName);
        const file = bucket.file(`avatars/${avatarFile.filename}`);
        
        await file.save(fileBuffer, {
          metadata: {
            contentType: 'image/png',
            metadata: {
              category: 'avatar',
              uploadedAt: new Date().toISOString(),
            },
          },
        });

        // Make the file publicly accessible
        await file.makePublic();
        
        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/avatars/${avatarFile.filename}`;
        
        // Get file metadata
        const [metadata] = await file.getMetadata();
        const fileSize = metadata.size ? parseInt(metadata.size.toString()) : 0;
        
        console.log(`   ✅ Uploaded successfully!`);
        console.log(`   📊 Size: ${(fileSize / 1024).toFixed(2)} KB`);
        console.log(`   🔗 URL: ${publicUrl.substring(0, 50)}...`);

        // Prepare template data
        const template = {
          avatar_name: avatarFile.avatarName,
          storage_url: publicUrl,
          category: 'avatar',
          gender: avatarFile.gender,
          is_public: true, // System avatars are public
          user_id: null, // null for system avatars
          file_name: avatarFile.filename,
          file_size: fileSize,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now(),
        };

        templateData.push(template);
        
      } catch (error) {
        console.error(`   ❌ Failed to upload ${avatarFile.filename}:`, error);
        throw error;
      }
    }

    console.log(`\n📝 Creating ${templateData.length} template records...`);

    // Create template records as individual documents in the avatars subcollection
    const batch = adminDb.batch();
    const templateIds: string[] = [];

    templateData.forEach((template) => {
      const docRef = adminDb
        .collection(COLLECTIONS.TEMPLATES)
        .doc('avatars')
        .collection('avatars')
        .doc();
      batch.set(docRef, template);
      templateIds.push(docRef.id);
    });

    await batch.commit();
    
    console.log(`   ✅ Created ${templateIds.length} template records`);
    console.log(`   🆔 Template IDs: ${templateIds.join(', ')}`);

    console.log('\n🎉 Avatar upload process completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   • Uploaded ${avatarFiles.length} avatar images`);
    console.log(`   • Created ${templateIds.length} template records`);
    console.log(`   • All avatars are public and available for selection`);

    return {
      uploadedFiles: avatarFiles.length,
      createdTemplates: templateIds.length,
      templateIds
    };

  } catch (error) {
    console.error('\n❌ Avatar upload process failed:', error);
    throw error;
  }
}

// Run the upload if this file is executed directly
if (require.main === module) {
  uploadAvatarImages()
    .then((result) => {
      console.log('\n✅ Upload script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Upload script failed:', error);
      process.exit(1);
    });
}

export { uploadAvatarImages }; 