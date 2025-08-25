# Firebase Storage Avatar Templates Integration

## Feature Description
Integrate Firebase Storage to handle avatar image uploads and create a new "templates" collection in Firestore to manage avatar templates. The feature will upload images from the example_avatar_images folder to Firebase Storage and create corresponding database records with metadata including avatar name, storage URL, category, gender, public status, and user ownership.

## Technical Requirements

### Firebase Storage Integration

**Storage Bucket Configuration:**
- Storage bucket: `gs://ugc-video-generator-e929d.firebasestorage.app`
- Avatar images stored in `/avatars` folder
- Images to upload: `paul.png`, `ashe.png`, `mark.png`, `mayra.png`

**Storage Operations:**
- Initialize Firebase Storage client
- Upload avatar images to `/avatars/{filename}` path
- Generate public download URLs for uploaded images
- Handle file metadata (size, type, upload time)

### Database Schema Changes

**New Templates Collection:**
```
templates/avatars/{avatarId}
├── avatar_name: string
├── storage_url: string
├── category: string
├── gender: "male" | "female" 
├── is_public: boolean
├── user_id: string
├── file_name: string
├── file_size: number
├── created_at: Timestamp
└── updated_at: Timestamp
```

### Files to Create/Modify

**Phase 1: Storage Layer**

**Firebase Storage Client:**
- `lib/firebase.ts` - Add Storage initialization
- `lib/storage.ts` - Storage upload/download operations
- `lib/templates.ts` - Template CRUD operations

**Type Definitions:**
- `types/firebase.ts` - Add Template interface and COLLECTIONS
- `types/templates.ts` - Template-specific types

**Phase 2: Upload Script**
- `scripts/upload-avatars.ts` - Script to upload example images and create template records

**Phase 3: API Layer**
- `app/api/templates/route.ts` - Template management endpoints
- `app/api/templates/avatars/route.ts` - Avatar-specific endpoints
- `app/api/templates/avatars/[avatarId]/route.ts` - Individual avatar operations

**Phase 4: Security Rules**
- `firestore.rules` - Add templates collection access rules

### Implementation Algorithm

**Avatar Upload Process:**
1. Read images from `example_avatar_images/` directory
2. For each image:
   - Generate unique avatar ID
   - Upload to Firebase Storage at `/avatars/{filename}`
   - Get public download URL
   - Create template record in `templates/avatars/{avatarId}`
   - Set metadata (name from filename, category, gender detection, public=true, user_id=null for system avatars)

**Template Record Creation:**
1. Parse filename to extract avatar name (e.g., "paul" from "paul.png")
2. Detect gender from filename or set as "neutral"
3. Set category as "avatar"
4. Set is_public as true for system avatars
5. Store file metadata (size, type)
6. Generate timestamps

### Security Considerations

**Firestore Rules:**
- Public templates: Read access for all authenticated users
- Private templates: Read/write access only for owner
- System avatars: Read-only for all users, write access for admins only

**Storage Rules:**
- Avatar images: Read access for all authenticated users
- Upload restrictions: File type validation (PNG, JPG)
- Size limits: Maximum 5MB per avatar image

### Environment Variables

**Required Storage Configuration:**
```env
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ugc-video-generator-e929d.appspot.com
```

### Error Handling

**Upload Failures:**
- Retry logic for network failures
- File validation (type, size)
- Duplicate filename handling
- Storage quota management

**Database Failures:**
- Transaction rollback if template creation fails after upload
- Cleanup of orphaned storage files
- Error logging and monitoring

### Performance Considerations

**Upload Optimization:**
- Batch uploads for multiple images
- Progress tracking for large files
- Compression for avatar images
- CDN caching for public avatars

**Database Optimization:**
- Index on `is_public` and `category` for filtering
- Index on `user_id` for user-specific queries
- Pagination for large template collections

## Goal of This Plan

This plan establishes the foundation for avatar template management in the UGC video generation system. It enables users to select from pre-uploaded avatar templates and provides the infrastructure for future user-uploaded avatar support. The templates collection will serve as the data source for avatar selection in the video generation workflow. 