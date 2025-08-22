import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';

import { auth } from '@/lib/auth';
import { adminDb } from '@/lib/firebase-admin';

export async function POST() {
  try {
    // Temporarily disable authentication for testing
    // const session = await auth.api.getSession({ headers: headers() });
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    console.log('Starting migration...');
    
    // Get all users from the users collection using Admin SDK
    const usersCollection = adminDb.collection('users');
    const snapshot = await usersCollection.get();
    
    console.log(`Found ${snapshot.size} users to migrate`);
    
    const writes: Promise<any>[] = [];
    const migratedUsers: string[] = [];
    
    snapshot.forEach((docSnap: any) => {
      const d = docSnap.data();
      const uid = docSnap.id;
      
      console.log(`Migrating user: ${uid}`);
      
      const next = {
        tier: d.tier ?? "free",
        credits: typeof d.availableCredits === "number" ? d.availableCredits : (d.credits ?? 50),
        email: d.email ?? "",
        name: d.name ?? "",
        createdAt: d.createdAt ?? FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      
      // Use set with merge to preserve existing data
      writes.push(adminDb.collection('users').doc(uid).set(next, { merge: true }));
      migratedUsers.push(uid);
    });
    
    await Promise.all(writes);
    console.log(`Successfully migrated ${writes.length} user(s).`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${writes.length} users`,
      migratedUsers,
    });
    
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 