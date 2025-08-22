1- “Create/Update user on sign-in”
Where to run it: in your app, right after Firebase Auth signs a user in (client) or in a server endpoint that handles session creation. The simplest path is client-side: call an upsertUser function after signInWithPopup/signInWithRedirect finishes.

Why: you want a single users/{uid} doc with your target shape, using server timestamps so time is set by Firestore, not the browser. 

Code (client, v9 modular):

// lib/db/upsertUser.ts
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase/client";

export async function upsertUser(uid: string, email: string, name: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(ref, {
      tier: "free",
      credits: 50,
      email,
      name,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }); // create
  } else {
    await updateDoc(ref, {
      email,
      name,
      updatedAt: serverTimestamp(),
    }); // update
  }
}


setDoc/updateDoc are the standard writes in Firestore v9. 


serverTimestamp() stores a server-generated timestamp. (In Admin SDK, you’d use FieldValue.serverTimestamp().) 


Call it after login:

const cred = await signInWithPopup(auth, provider);
await upsertUser(cred.user.uid, cred.user.email ?? "", cred.user.displayName ?? "");


2- “Migration script”
Run this Admin SDK script once to reshape each user doc to the new schema and backfill timestamps. (e.g., map availableCredits → credits) and set createdAt/updatedAt.

// scripts/migrate-users.ts  (run with: ts-node scripts/migrate-users.ts)
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

initializeApp({ credential: applicationDefault() });
const db = getFirestore();

async function run() {
  const col = db.collection("users");
  const snapshot = await col.get();

  const writes: Promise<any>[] = [];
  snapshot.forEach(docSnap => {
    const d = docSnap.data();
    const uid = docSnap.id;

    const next = {
      tier: d.tier ?? "free",
      credits: typeof d.availableCredits === "number" ? d.availableCredits : (d.credits ?? 0),
      email: d.email ?? "",
      name: d.name ?? "",
      // If your old docs already have createdAt/updatedAt (as Timestamp), keep them.
      createdAt: d.createdAt ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    writes.push(col.doc(uid).set(next, { merge: true }));
    // Optionally remove deprecated fields:
    // writes.push(col.doc(uid).update({ availableCredits: FieldValue.delete(), freeCreditsUsed: FieldValue.delete() }));
  });

  await Promise.all(writes);
  console.log(`Migrated ${writes.length} user(s).`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

3- Typical queries (no special indexes needed yet)
Reading the current user:
import { doc, getDoc } from "firebase/firestore";
const ref = doc(db, "users", uid);
const snap = await getDoc(ref); // reads a single doc

Firestore queries/indexes matter as your app grows, but this single-doc read is trivial and doesn’t require composites. Design around document/collection patterns for performance and cost.

What you’ll have at the end

A normalized users/{uid} document for each user with tier, credits, email, name, and server-managed createdAt/updatedAt.
A migration script to bring existing docs to the new shape.
A clear place in your auth flow to maintain the profile on every login.