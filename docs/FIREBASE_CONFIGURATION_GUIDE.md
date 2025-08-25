# Firebase Configuration Guide

## 🎯 Firebase SDK Usage Rules

### **Client-Side Firebase SDK** (Browser/React)
**Use when:**
- ✅ User authentication (sign in, sign out)
- ✅ Real-time data (Firestore listeners)
- ✅ User-initiated actions (upload files, create documents)
- ✅ Public data access (reading public documents)
- ✅ Interactive features (user selects avatar, creates project)

**Example:**
```typescript
// In React components
import { auth, db, storage } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { collection, addDoc } from 'firebase/firestore';
```

### **Firebase Admin SDK** (Server-side)
**Use when:**
- ✅ API routes (`/api/*`)
- ✅ Scripts and automation (data migration, bulk uploads)
- ✅ Admin operations (managing users, system data)
- ✅ Background jobs
- ✅ Operations that don't require user authentication

**Example:**
```typescript
// In API routes or scripts
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { verifyIdToken } from 'firebase-admin/auth';
```

## 🔧 Configuration Methods

### Method 1: Service Account Key File (Recommended for Admin SDK)

**Step 1: Download Service Account Key**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save as `service-account-key.json`

**Step 2: Set Environment Variable**
```bash
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

**Step 3: Use in Code**
```typescript
import { initializeApp, cert } from 'firebase-admin/app';
import serviceAccount from './service-account-key.json';

initializeApp({
  credential: cert(serviceAccount),
  storageBucket: 'your-project.appspot.com'
});
```

### Method 2: Environment Variables (Alternative)

**For Client-Side:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**For Admin SDK:**
```env
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

## 📁 File Structure

```
your-project/
├── lib/
│   ├── firebase.ts          # Client-side Firebase config
│   ├── firebase-admin.ts    # Admin SDK config
│   ├── storage.ts           # Client-side storage operations
│   └── templates.ts         # Client-side template operations
├── app/
│   └── api/
│       └── templates/
│           └── route.ts     # Server-side API (uses Admin SDK)
├── scripts/
│   └── upload-avatars-admin.ts  # Server-side script (uses Admin SDK)
└── service-account-key.json     # Admin SDK credentials
```

## 🔐 Authentication Flow

### Client-Side Authentication
```typescript
// User signs in
const userCredential = await signInWithEmailAndPassword(auth, email, password);
const user = userCredential.user;

// Get ID token for API calls
const idToken = await user.getIdToken();

// Make API call with token
const response = await fetch('/api/templates', {
  headers: {
    'Authorization': `Bearer ${idToken}`
  }
});
```

### Server-Side Authentication
```typescript
// In API route
const authHeader = request.headers.get('authorization');
const token = authHeader?.substring(7); // Remove 'Bearer '
const decodedToken = await adminAuth.verifyIdToken(token);
const userId = decodedToken.uid;
```

## 🚀 Common Patterns

### Pattern 1: User Uploads Avatar (Client → Server)
```typescript
// 1. Client-side: User selects file
const file = event.target.files[0];

// 2. Client-side: Upload to storage
const uploadResult = await uploadAvatar(file, filename);

// 3. Client-side: Create template via API
const response = await fetch('/api/templates', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${idToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    avatar_name: 'My Avatar',
    storage_url: uploadResult.url,
    // ... other fields
  })
});
```

### Pattern 2: System Uploads Avatars (Server-only)
```typescript
// Script runs on server with Admin SDK
const adminStorage = getStorage();
const bucket = adminStorage.bucket();
const file = bucket.file(`avatars/${filename}`);

await file.save(fileBuffer, { metadata: { contentType: 'image/png' } });
await file.makePublic();
```

### Pattern 3: User Views Avatars (Client-side)
```typescript
// Client-side: Get public avatars
const publicTemplates = await getPublicAvatarTemplates();

// Display in React component
return (
  <div>
    {publicTemplates.map(template => (
      <img key={template.id} src={template.storage_url} alt={template.avatar_name} />
    ))}
  </div>
);
```

## ⚠️ Common Mistakes

### ❌ Don't Use Client SDK in Server Code
```typescript
// WRONG: Using client SDK in API route
import { auth } from '@/lib/firebase'; // ❌

// RIGHT: Use Admin SDK in API route
import { adminAuth } from '@/lib/firebase-admin'; // ✅
```

### ❌ Don't Use Admin SDK in Client Code
```typescript
// WRONG: Using Admin SDK in React component
import { adminAuth } from '@/lib/firebase-admin'; // ❌

// RIGHT: Use client SDK in React component
import { auth } from '@/lib/firebase'; // ✅
```

### ❌ Don't Expose Admin Credentials
```typescript
// WRONG: Using NEXT_PUBLIC_ prefix for admin credentials
NEXT_PUBLIC_FIREBASE_PRIVATE_KEY=... // ❌

// RIGHT: Use regular env vars for admin credentials
FIREBASE_PRIVATE_KEY=... // ✅
```

## 🧪 Testing

### Test Client-Side Operations
```bash
npm run dev  # Start development server
# Test in browser with React components
```

### Test Server-Side Operations
```bash
npm run upload-avatars-admin  # Test admin script
npm run test-storage          # Test storage integration
```

### Test API Endpoints
```bash
# Use tools like Postman or curl
curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
     http://localhost:3000/api/templates
```

## 🔄 Migration Checklist

When setting up Firebase in a new project:

1. ✅ **Download service account key** from Firebase Console
2. ✅ **Set GOOGLE_APPLICATION_CREDENTIALS** environment variable
3. ✅ **Create client-side config** (`lib/firebase.ts`)
4. ✅ **Create admin config** (`lib/firebase-admin.ts`)
5. ✅ **Test both configurations** with simple operations
6. ✅ **Set up security rules** for Firestore and Storage
7. ✅ **Create API routes** using Admin SDK
8. ✅ **Create client components** using client SDK

## 📚 Resources

- [Firebase Admin SDK Documentation](https://firebase.google.com/docs/admin/setup)
- [Firebase Client SDK Documentation](https://firebase.google.com/docs/web/setup)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction) 