# Firebase Migration Plan

## Current Issues to Fix

### 1. Build Errors
- **Problem**: Missing `@/lib/auth` module causing build failures
- **Files affected**:
  - `app/api/record-generation/route.ts`
  - `app/api/user/credits/route.ts`
  - `app/api/user/generations/route.ts`
  - `app/auth/sign-in/page.tsx`
  - `app/auth/sign-up/page.tsx`
  - `app/dashboard/page.tsx`

- **Solution**: Create a unified auth interface that bridges Firebase client and server-side authentication

### 2. Authentication Architecture
- **Current State**: Firebase client auth implemented in `firebase-auth.ts` and `use-firebase-auth.ts`
- **Missing**: Server-side auth middleware and session management
- **Need**: Create `lib/auth.ts` that provides:
  - Server-side session validation
  - Client-side auth hooks
  - Unified API for both client and server

## Firebase Services Setup Plan

### 1. Firebase Console Configuration

#### Authentication
- [ ] Enable Email/Password authentication
- [ ] Enable Google OAuth provider
- [ ] Configure authorized domains
- [ ] Set up password reset templates
- [ ] Configure email verification templates

#### Firestore Database
- [ ] Create database in test mode initially
- [ ] Set up security rules for:
  - User data (users can only access their own data)
  - Credits system (read/write for authenticated users)
  - Generations (users can only access their own generations)
  - Admin access for credit management

#### Storage (Optional for future video features)
- [ ] Enable Cloud Storage
- [ ] Configure security rules for file uploads
- [ ] Set up CORS configuration for web access

### 2. Environment Variables Setup
- [ ] Client-side Firebase config (already exists)
- [ ] Server-side Firebase Admin config
- [ ] Verify all environment variables are properly set

### 3. Database Schema Design

#### Users Collection
```typescript
interface User {
  uid: string;
  email: string;
  name: string;
  emailVerified: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  credits: {
    paid: number;
    free: number;
  };
  settings?: {
    emailNotifications: boolean;
    theme: 'light' | 'dark';
  };
}
```

#### Credits Collection
```typescript
interface CreditTransaction {
  id: string;
  userId: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  createdAt: Timestamp;
  metadata?: {
    generationId?: string;
    paymentId?: string;
  };
}
```

#### Generations Collection
```typescript
interface Generation {
  id: string;
  userId: string;
  prompt: string;
  category: string;
  numImages: number;
  imageUrls: string[];
  imageSize: string;
  style?: string;
  renderingSpeed?: string;
  falRequestId?: string;
  creditsUsed: number;
  usedFreeCredit: boolean;
  createdAt: Timestamp;
}
```

### 4. Security Rules Implementation

#### Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Credits - users can read their own, admins can write
    match /credits/{creditId} {
      allow read: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow write: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         request.auth.token.admin == true);
    }
    
    // Generations - users can only access their own
    match /generations/{generationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

#### Storage Rules (for future use)
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
  }
}
```

### 5. Implementation Steps

#### Phase 1: Fix Build Errors
1. Create `lib/auth.ts` with unified auth interface
2. Update all API routes to use new auth system
3. Update client components to use Firebase auth hooks
4. Test build process

#### Phase 2: Firebase Services Setup
1. Configure Firebase Console services
2. Set up environment variables
3. Implement security rules
4. Create database indexes for queries

#### Phase 3: Data Migration (if needed)
1. Export existing data from previous system
2. Transform data to match new schema
3. Import data to Firestore
4. Verify data integrity

#### Phase 4: Testing & Validation
1. Test authentication flow
2. Test credit system
3. Test generation recording
4. Test security rules
5. Performance testing

### 6. API Routes to Update

#### Authentication Routes
- [ ] `app/api/auth/sign-in/route.ts` (if needed)
- [ ] `app/api/auth/sign-up/route.ts` (if needed)
- [ ] `app/api/auth/sign-out/route.ts` (if needed)

#### User Management Routes
- [ ] `app/api/user/credits/route.ts` ✅ (needs auth fix)
- [ ] `app/api/user/generations/route.ts` ✅ (needs auth fix)
- [ ] `app/api/user/profile/route.ts` (if needed)

#### Generation Routes
- [ ] `app/api/record-generation/route.ts` ✅ (needs auth fix)

### 7. Client Components to Update

#### Authentication Components
- [ ] `components/auth/auth-sign-in-form.tsx` ✅ (already using Firebase)
- [ ] `components/auth/auth-sign-up-form.tsx` ✅ (already using Firebase)
- [ ] `components/auth/forgot-password-form.tsx`
- [ ] `components/auth/reset-password-form.tsx`
- [ ] `components/auth/resend-verification-form.tsx`

#### Dashboard Components
- [ ] `components/dashboard/DashboardClient.tsx` ✅ (already using Firebase)
- [ ] `components/credits-display.tsx`
- [ ] `components/user-menu.tsx`

### 8. Environment Variables Checklist

#### Client-side (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

#### Server-side (.env.local)
```
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

### 9. Testing Checklist

#### Authentication Testing
- [ ] Email/password sign up
- [ ] Email/password sign in
- [ ] Google OAuth sign in
- [ ] Password reset
- [ ] Email verification
- [ ] Sign out
- [ ] Session persistence

#### Credit System Testing
- [ ] Credit balance display
- [ ] Credit deduction on generation
- [ ] Credit purchase (when payment is implemented)
- [ ] Credit history

#### Generation System Testing
- [ ] Generation recording
- [ ] Generation history
- [ ] Credit validation before generation

#### Security Testing
- [ ] Unauthorized access prevention
- [ ] Data isolation between users
- [ ] Admin access (if implemented)

### 10. Performance Considerations

#### Firestore Optimization
- [ ] Create composite indexes for queries
- [ ] Implement pagination for large datasets
- [ ] Use offline persistence for better UX
- [ ] Implement caching strategies

#### Security Optimization
- [ ] Rate limiting for API routes
- [ ] Input validation and sanitization
- [ ] Error handling without information leakage

### 11. Monitoring & Analytics

#### Firebase Analytics
- [ ] Set up Firebase Analytics
- [ ] Track user engagement
- [ ] Monitor conversion rates

#### Error Monitoring
- [ ] Set up error tracking
- [ ] Monitor API performance
- [ ] Track authentication failures

### 12. Future Enhancements

#### Video Generation Features
- [ ] Extend credit system for video credits
- [ ] Add video upload/processing
- [ ] Implement video generation queue
- [ ] Add video preview/playback

#### Advanced Features
- [ ] User preferences and settings
- [ ] Social features (sharing, likes)
- [ ] Advanced analytics dashboard
- [ ] Admin panel for user management

## Success Criteria

1. ✅ Build process completes without errors
2. ✅ All authentication flows work correctly
3. ✅ Credit system functions properly
4. ✅ Generation recording works
5. ✅ Security rules prevent unauthorized access
6. ✅ Performance meets requirements
7. ✅ All existing functionality preserved

## Timeline Estimate

- **Phase 1 (Build Fixes)**: 1-2 hours
- **Phase 2 (Firebase Setup)**: 2-4 hours
- **Phase 3 (Testing)**: 2-3 hours
- **Total**: 5-9 hours

## Risk Mitigation

1. **Backup Strategy**: Keep existing code as backup until migration is complete
2. **Gradual Rollout**: Test thoroughly before deploying to production
3. **Rollback Plan**: Maintain ability to revert to previous system if needed
4. **Data Backup**: Export all user data before migration 