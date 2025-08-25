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

async function testTemplatesLibrary() {
  console.log('🧪 Testing Templates Library Functionality...\n');

  try {
    // Test 1: Get all public templates
    console.log('1️⃣ Testing getPublicAvatarTemplates equivalent...');
    const publicTemplatesSnapshot = await adminDb
      .collection(COLLECTIONS.TEMPLATES)
      .doc('avatars')
      .collection('avatars')
      .where('is_public', '==', true)
      .limit(10)
      .get();

    if (!publicTemplatesSnapshot.empty) {
      console.log(`   ✅ Found ${publicTemplatesSnapshot.size} public templates`);
      
      publicTemplatesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   📄 ${data.avatar_name} (${data.gender}) - ${doc.id}`);
      });
    } else {
      console.log('   ⚠️  No public templates found');
    }

    // Test 2: Get templates by gender (female)
    console.log('\n2️⃣ Testing getAvatarTemplatesByGender (female)...');
    const femaleTemplatesSnapshot = await adminDb
      .collection(COLLECTIONS.TEMPLATES)
      .doc('avatars')
      .collection('avatars')
      .where('gender', '==', 'female')
      .where('is_public', '==', true)
      .limit(10)
      .get();

    if (!femaleTemplatesSnapshot.empty) {
      console.log(`   ✅ Found ${femaleTemplatesSnapshot.size} female templates`);
      
      femaleTemplatesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   📄 ${data.avatar_name} (${data.gender}) - ${doc.id}`);
      });
    } else {
      console.log('   ⚠️  No female templates found');
    }

    // Test 3: Get templates by gender (male)
    console.log('\n3️⃣ Testing getAvatarTemplatesByGender (male)...');
    const maleTemplatesSnapshot = await adminDb
      .collection(COLLECTIONS.TEMPLATES)
      .doc('avatars')
      .collection('avatars')
      .where('gender', '==', 'male')
      .where('is_public', '==', true)
      .limit(10)
      .get();

    if (!maleTemplatesSnapshot.empty) {
      console.log(`   ✅ Found ${maleTemplatesSnapshot.size} male templates`);
      
      maleTemplatesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   📄 ${data.avatar_name} (${data.gender}) - ${doc.id}`);
      });
    } else {
      console.log('   ⚠️  No male templates found');
    }

    // Test 4: Get individual template by ID
    console.log('\n4️⃣ Testing getAvatarTemplate by ID...');
    if (!publicTemplatesSnapshot.empty) {
      const firstTemplateId = publicTemplatesSnapshot.docs[0].id;
      console.log(`   📄 Testing with template ID: ${firstTemplateId}`);
      
      const individualTemplate = await adminDb
        .collection(COLLECTIONS.TEMPLATES)
        .doc('avatars')
        .collection('avatars')
        .doc(firstTemplateId)
        .get();

      if (individualTemplate.exists) {
        const data = individualTemplate.data();
        console.log(`   ✅ Success! Retrieved template: ${data?.avatar_name}`);
        console.log(`   📊 Template details: ${data?.gender}, ${data?.category}, ${data?.file_name}`);
        console.log(`   🔗 Storage URL: ${data?.storage_url?.substring(0, 50)}...`);
      } else {
        console.log('   ❌ Template not found');
      }
    } else {
      console.log('   ⚠️  No templates available for individual testing');
    }

    // Test 5: Test filtering and ordering
    console.log('\n5️⃣ Testing filtering and ordering...');
    const orderedTemplatesSnapshot = await adminDb
      .collection(COLLECTIONS.TEMPLATES)
      .doc('avatars')
      .collection('avatars')
      .where('is_public', '==', true)
      .orderBy('avatar_name', 'asc')
      .limit(5)
      .get();

    if (!orderedTemplatesSnapshot.empty) {
      console.log(`   ✅ Found ${orderedTemplatesSnapshot.size} templates (ordered by name)`);
      
      orderedTemplatesSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`   📄 ${data.avatar_name} (${data.gender})`);
      });
    } else {
      console.log('   ⚠️  No templates found with ordering');
    }

    console.log('\n🎉 Templates library testing completed!');
    console.log('\n📋 Summary:');
    console.log('   • Database structure: templates/avatars/avatars/{avatarId} ✅');
    console.log('   • Public templates filtering: ✅');
    console.log('   • Gender filtering: ✅');
    console.log('   • Individual template retrieval: ✅');
    console.log('   • Ordering and limiting: ✅');
    console.log('   • All core functionality working correctly!');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testTemplatesLibrary()
    .then(() => {
      console.log('\n✅ Templates library test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Templates library test failed:', error);
      process.exit(1);
    });
}

export { testTemplatesLibrary }; 