#!/usr/bin/env tsx

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { COLLECTIONS } from '../types/firebase';
import 'dotenv/config';

// Initialize Firebase Admin if not already initialized
if (getApps().length === 0) {
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

const adminDb = getFirestore();

async function testTemplatesStructure() {
  console.log('🧪 Testing Templates Database Structure...\n');

  try {
    // Test 1: Check if templates/avatars document exists
    console.log('1️⃣ Testing templates/avatars document...');
    const templatesDoc = await adminDb.collection(COLLECTIONS.TEMPLATES).doc('avatars').get();
    
    if (templatesDoc.exists) {
      console.log('   ✅ templates/avatars document exists');
    } else {
      console.log('   ⚠️  templates/avatars document does not exist (this is normal if no templates uploaded yet)');
    }

    // Test 2: Check if templates/avatars/avatars subcollection exists and has documents
    console.log('\n2️⃣ Testing templates/avatars/avatars subcollection...');
    const avatarsSnapshot = await adminDb
      .collection(COLLECTIONS.TEMPLATES)
      .doc('avatars')
      .collection('avatars')
      .get();

    if (!avatarsSnapshot.empty) {
      console.log(`   ✅ Found ${avatarsSnapshot.size} avatar templates`);
      
      avatarsSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   📄 Template ID: ${doc.id}`);
        console.log(`      Name: ${data.avatar_name}`);
        console.log(`      Gender: ${data.gender}`);
        console.log(`      Public: ${data.is_public}`);
        console.log(`      URL: ${data.storage_url?.substring(0, 50)}...`);
        console.log('');
      });
    } else {
      console.log('   ⚠️  No avatar templates found in templates/avatars/avatars');
      console.log('   💡 Run the upload script first: npm run upload-avatars');
    }

    // Test 3: Verify the structure matches what the API expects
    console.log('3️⃣ Testing API-compatible structure...');
    
    // Test the exact path that the API uses
    const apiTestSnapshot = await adminDb
      .collection(COLLECTIONS.TEMPLATES)
      .doc('avatars')
      .collection('avatars')
      .limit(1)
      .get();

    if (!apiTestSnapshot.empty) {
      console.log('   ✅ API can access templates using templates/avatars/avatars structure');
      
      const firstDoc = apiTestSnapshot.docs[0];
      const data = firstDoc.data();
      console.log(`   📄 Sample template: ${data.avatar_name} (${data.gender})`);
    } else {
      console.log('   ❌ API cannot access templates - structure mismatch');
    }

    console.log('\n🎉 Database structure test completed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testTemplatesStructure()
    .then(() => {
      console.log('\n✅ Test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error);
      process.exit(1);
    });
}

export { testTemplatesStructure }; 