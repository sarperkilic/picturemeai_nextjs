# Avatar Selection in Video Generation Pipeline

## Feature Description
Enhance the "Choose Your Character" section in the UGC video generation modal to provide users with two distinct options: 1) Upload a custom image from their device, and 2) Select from pre-existing avatar templates. The selected image will be passed through the video generation pipeline as an input image for the talking head generation.

## Technical Requirements

### Current State Analysis
The existing `ImageStep` component currently only shows a single example avatar option. The system already has:
- Firebase Storage integration for avatar uploads
- Templates collection with avatar metadata
- API endpoints for template management
- Video generation pipeline that accepts image inputs

### Enhanced Character Selection Interface

**Component 1: Upload an Image**
- Icon: Stylized image icon with plus sign
- Text: "Upload an image"
- Functionality:
  - Opens device file explorer
  - Handles common image formats (JPEG, PNG, GIF)
  - Validates file size and dimensions
  - User fills avatar name, gender, and category
  - Uploads to Firebase Storage under `/avatars` folder with naming pattern: `{avatar_name}_{gender}_{userid}`
  - Creates new document in `/templates/avatars/avatars/{avatar_id}`
  - Shows preview of uploaded image

**Component 2: Select Avatar**
- Icon: Person/user icon with plus sign
- Text: "Select Avatar"
- Functionality:
  - Opens popup window with avatar gallery
  - Displays grid of available pre-designed avatars from `/templates/avatars/avatars` collection
  - Shows only public avatars and avatars not owned by current user
  - Includes filtering by categories (Car Talk, Podcast, Indoor, Outdoor) and gender
  - Each avatar card shows thumbnail image and name
  - Clicking selects avatar and closes popup

### Files to Create/Modify

**Phase 1: Enhanced ImageStep Component**
- `components/dashboard/ugc-steps/ImageStep.tsx` - Complete rewrite with dual selection options
- `components/dashboard/ugc-steps/AvatarUploadModal.tsx` - New modal for image upload with form
- `components/dashboard/ugc-steps/AvatarSelectionModal.tsx` - New modal for template selection
- `components/dashboard/ugc-steps/AvatarCard.tsx` - Reusable avatar card component

**Phase 2: API Integration**
- `app/api/templates/avatars/upload/route.ts` - New endpoint for user avatar uploads
- `lib/avatar-upload.ts` - Client-side avatar upload utilities
- `lib/avatar-selection.ts` - Client-side template fetching utilities

**Phase 3: State Management Updates**
- `types/ugc.ts` - Update VideoConfig interface for enhanced character selection
- `lib/ugc-store.ts` - Add avatar upload and selection state management

**Phase 4: Video Generation Integration**
- `components/dashboard/UGCModal.tsx` - Update to pass selected image to generation pipeline
- `lib/video-generation-service.ts` - Ensure proper image URL handling

### Implementation Algorithm

**Avatar Upload Process:**
1. User clicks "Upload an Image" button
2. Opens file picker dialog
3. User selects image file (validates format and size)
4. Shows upload form with fields:
   - Avatar name (required)
   - Gender selection (male/female/neutral)
   - Category selection (dropdown)
5. User clicks upload button
6. Uploads image to Firebase Storage at `/avatars/{avatar_name}_{gender}_{userid}.{ext}`
7. Creates template record in Firestore with user ownership
8. Updates video config with uploaded image URL
9. Shows preview of uploaded image

**Avatar Selection Process:**
1. User clicks "Select Avatar" button
2. Opens avatar selection modal
3. Fetches public avatar templates from API
4. Displays grid of available avatars
5. User can filter by category and gender
6. User clicks on desired avatar
7. Updates video config with selected avatar ID and URL
8. Closes modal and shows preview

**Video Generation Integration:**
1. When user proceeds to generation, system checks character type
2. If type is 'upload': uses imageUrl from videoConfig
3. If type is 'avatar': uses avatarId to fetch template and get storage_url
4. Passes image URL to video generation pipeline

### Database Schema Updates

**Enhanced Template Structure:**
```
templates/avatars/avatars/{avatar_id}
├── avatar_name: string
├── storage_url: string
├── category: string
├── gender: "male" | "female" | "neutral"
├── is_public: boolean
├── user_id: string | null
├── file_name: string
├── file_size: number
├── created_at: Timestamp
├── updated_at: Timestamp
└── upload_source: "user" | "system" // New field
```

**New Upload Endpoint Schema:**
```
POST /api/templates/avatars/upload
Request:
{
  "avatar_name": string,
  "gender": "male" | "female" | "neutral",
  "category": string,
  "file": File
}

Response:
{
  "success": true,
  "data": {
    "id": string,
    "storage_url": string,
    "avatar_name": string
  }
}
```

### UI/UX Design Requirements

**Upload Modal Design:**
- File drop zone with drag-and-drop support
- Image preview after selection
- Form fields for avatar metadata
- Upload progress indicator
- Error handling and validation messages

**Selection Modal Design:**
- Grid layout for avatar cards
- Filter bar with category and gender options
- Search functionality for avatar names
- Responsive design for mobile/desktop
- Loading states and error handling

**Avatar Card Component:**
- Square aspect ratio for consistency
- Avatar name below image
- Selection indicator (checkmark/ring)
- Hover effects and animations

### Error Handling

**Upload Validation:**
- File type validation (PNG, JPG, GIF only)
- File size limits (max 5MB)
- Image dimension validation (min 200x200, max 2000x2000)
- Duplicate name handling
- Network error recovery

**Selection Validation:**
- API error handling for template fetching
- Empty state when no avatars available
- Loading states for better UX
- Fallback to default avatar if selection fails

### Performance Considerations

**Image Optimization:**
- Client-side image compression before upload
- Progressive image loading in gallery
- Lazy loading for large avatar grids
- Caching of frequently accessed templates

**API Optimization:**
- Pagination for large template collections
- Caching of public avatar templates
- Efficient filtering and sorting
- CDN usage for avatar images

### Security Considerations

**Upload Security:**
- File type validation on server side
- Virus scanning for uploaded images
- User quota limits for uploads
- Secure file naming to prevent conflicts

**Access Control:**
- Users can only access public templates and their own
- Proper authentication for all API calls
- Rate limiting for upload endpoints
- Audit logging for template creation

## Goal of This Plan

This plan establishes a comprehensive avatar selection system that integrates seamlessly with the existing video generation pipeline. It provides users with flexible options for character selection while maintaining the security and performance standards of the application. The implementation will enhance the user experience by offering both custom upload capabilities and curated template selection, ultimately improving the quality and variety of generated UGC videos. 