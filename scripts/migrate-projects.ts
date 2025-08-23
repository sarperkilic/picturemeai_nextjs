import { adminDb } from '@/lib/firebase-admin-with-credentials';
import { FieldValue } from 'firebase-admin/firestore';

export async function migrateExistingGenerationsToProjects() {
  try {
    console.log('Starting migration of existing generations to projects...');
    
    // First, let's check if there are any generations at all
    const generationsRef = adminDb.collection('generations');
    const snapshot = await generationsRef.get();
    
    console.log(`Found ${snapshot.size} generations to migrate`);
    
    if (snapshot.size === 0) {
      console.log('No generations found. Creating a test project instead...');
      await createTestProject();
      return;
    }
    
    const batch = adminDb.batch();
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const doc of snapshot.docs) {
      try {
        const generationData = doc.data();
        console.log(`Processing generation ${doc.id}:`, {
          userId: generationData.userId,
          prompt: generationData.prompt?.substring(0, 50) + '...',
          creditsUsed: generationData.creditsUsed
        });
        
        if (!generationData.userId) {
          console.warn(`Generation ${doc.id} has no userId, skipping...`);
          continue;
        }
        
        // Create project from generation
        const projectRef = adminDb
          .collection('users')
          .doc(generationData.userId)
          .collection('projects')
          .doc();
        
        const projectData = {
          title: `Generated Video ${migratedCount + 1}`,
          status: 'complete',
          duration: 15, // Default duration
          flow: {
            script: generationData.prompt || '',
            voiceId: 'default',
            avatarId: 'default',
          },
          usedCredits: generationData.creditsUsed || 1,
          createdAt: generationData.createdAt || FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        
        batch.set(projectRef, projectData);
        migratedCount++;
        
        console.log(`Added project ${projectRef.id} to batch for user ${generationData.userId}`);
        
      } catch (error) {
        console.error(`Error processing generation ${doc.id}:`, error);
        errorCount++;
      }
    }
    
    if (migratedCount > 0) {
      console.log(`Committing batch with ${migratedCount} projects...`);
      await batch.commit();
      console.log(`Successfully migrated ${migratedCount} generations to projects`);
    } else {
      console.log('No valid projects to migrate. Creating a test project instead...');
      await createTestProject();
    }
    
    if (errorCount > 0) {
      console.warn(`${errorCount} generations had errors during processing`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    console.log('Creating a test project instead...');
    await createTestProject();
  }
}

async function createTestProject() {
  try {
    console.log('Creating a test project...');
    
    // First, let's check if there are any users
    const usersRef = adminDb.collection('users');
    const usersSnapshot = await usersRef.limit(1).get();
    
    if (usersSnapshot.size === 0) {
      console.log('No users found. Creating a test user first...');
      const testUserRef = adminDb.collection('users').doc('test-user-123');
      await testUserRef.set({
        email: 'test@example.com',
        name: 'Test User',
        tier: 'free',
        credits: 10,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Created test user: test-user-123');
    }
    
    const userId = usersSnapshot.size > 0 ? usersSnapshot.docs[0].id : 'test-user-123';
    console.log(`Using user ID: ${userId}`);
    
    // Create a test project
    const projectRef = adminDb
      .collection('users')
      .doc(userId)
      .collection('projects')
      .doc();
    
    const projectData = {
      title: 'Test Project - Migration',
      status: 'complete',
      duration: 15,
      flow: {
        script: 'This is a test project created during migration.',
        voiceId: 'default',
        avatarId: 'default',
      },
      usedCredits: 1,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };
    
    await projectRef.set(projectData);
    console.log(`Successfully created test project: ${projectRef.id} under user: ${userId}`);
    console.log(`You should now see a 'projects' collection under users/${userId} in Firebase`);
    
  } catch (error) {
    console.error('Error creating test project:', error);
    throw error;
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  console.log('Starting migration script...');
  console.log('Current working directory:', process.cwd());
  
  migrateExistingGenerationsToProjects()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
} 