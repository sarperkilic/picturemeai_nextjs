# Phase 2: Avatar Selection API Integration

## Overview
Phase 2 of the avatar selection system implements the complete API integration layer, providing robust avatar upload, selection, and management capabilities. This phase builds upon the existing infrastructure to deliver a comprehensive avatar selection experience.

## Implementation Status
✅ **COMPLETED** - All Phase 2 components have been implemented and tested.

## Core Components

### 1. Enhanced Avatar Upload API
**File:** `app/api/templates/avatars/upload/route.ts`

**Features:**
- ✅ Multipart form data support for direct file uploads
- ✅ File validation (type, size, dimensions)
- ✅ Firebase Storage integration with Admin SDK
- ✅ Automatic template creation in Firestore
- ✅ Backward compatibility with JSON requests
- ✅ Proper error handling and validation

**API Endpoint:**
```
POST /api/templates/avatars/upload
Content-Type: multipart/form-data

Form Data:
- file: File (required)
- avatar_name: string (required)
- gender: "male" | "female" | "neutral" (required)
- category: string (required)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "avatar_123",
    "storage_url": "https://storage.googleapis.com/bucket/avatars/avatar.png",
    "avatar_name": "My Avatar"
  },
  "message": "Avatar uploaded successfully"
}
```

### 2. Enhanced Avatar Selection API
**File:** `app/api/templates/avatars/route.ts`

**Features:**
- ✅ Advanced filtering by gender, category, and search
- ✅ Pagination support
- ✅ Multiple query types (public, user, gender)
- ✅ Client-side search filtering
- ✅ Proper authentication and authorization

**API Endpoint:**
```
GET /api/templates/avatars?type=public&gender=male&category=Professional&limit=20
```

**Query Parameters:**
- `type`: "public" | "user" | "gender"
- `gender`: "male" | "female" | "neutral"
- `category`: string
- `search`: string
- `limit`: number (default: 50)
- `offset`: number (default: 0)
- `orderBy`: "created_at" | "avatar_name"
- `orderDirection`: "asc" | "desc"

### 3. Avatar Categories API
**File:** `app/api/templates/avatars/categories/route.ts`

**Features:**
- ✅ Dynamic category extraction from existing templates
- ✅ Fallback to default categories
- ✅ Authentication required
- ✅ Sorted category list

**API Endpoint:**
```
GET /api/templates/avatars/categories
```

**Response:**
```json
{
  "success": true,
  "data": [
    "Car Talk",
    "Casual",
    "Indoor",
    "Outdoor",
    "Podcast",
    "Professional"
  ]
}
```

### 4. Enhanced Client-Side Utilities

#### Avatar Upload Utilities
**File:** `lib/avatar-upload.ts`

**Features:**
- ✅ `uploadAvatarWithFormData()` - Recommended upload method
- ✅ `validateAvatarFile()` - Client-side file validation
- ✅ `uploadAvatar()` - Legacy upload method
- ✅ Proper error handling and type safety

**Usage:**
```typescript
import { uploadAvatarWithFormData, validateAvatarFile } from '@/lib/avatar-upload';

// Validate file first
const validation = validateAvatarFile(file);
if (!validation.isValid) {
  throw new Error(validation.error);
}

// Upload avatar
const result = await uploadAvatarWithFormData({
  file,
  avatarName: 'My Avatar',
  gender: 'male',
  category: 'Professional'
});
```

#### Avatar Selection Utilities
**File:** `lib/avatar-selection.ts`

**Features:**
- ✅ `getPublicAvatarTemplates()` - Get public avatars with filtering
- ✅ `getUserAvatarTemplates()` - Get user's own avatars
- ✅ `getAvatarTemplatesByGender()` - Get avatars by gender
- ✅ `searchAvatarTemplates()` - Search avatars by name
- ✅ `getAvatarCategories()` - Get available categories
- ✅ Enhanced filtering and search capabilities

**Usage:**
```typescript
import { 
  getPublicAvatarTemplates, 
  getAvatarTemplatesByGender,
  searchAvatarTemplates 
} from '@/lib/avatar-selection';

// Get public avatars with filtering
const avatars = await getPublicAvatarTemplates({
  limit: 20,
  filters: {
    gender: 'male',
    category: 'Professional'
  }
});

// Search avatars
const searchResults = await searchAvatarTemplates('Paul', { limit: 10 });
```

### 5. Enhanced State Management
**File:** `lib/ugc-store.ts`

**New Actions:**
- ✅ `setSelectedAvatar()` - Set selected template avatar
- ✅ `setUploadedAvatar()` - Set uploaded custom avatar
- ✅ `clearAvatarSelection()` - Clear avatar selection

**Usage:**
```typescript
import { useUGCStore } from '@/lib/ugc-store';

const { setSelectedAvatar, setUploadedAvatar } = useUGCStore();

// Set selected template avatar
setSelectedAvatar('avatar_123', 'https://example.com/avatar.png');

// Set uploaded custom avatar
setUploadedAvatar('https://example.com/uploaded-avatar.png');
```

## Database Schema

### Enhanced Template Structure
```typescript
interface AvatarTemplate {
  id: string;
  avatar_name: string;
  storage_url: string;
  category: string;
  gender: 'male' | 'female' | 'neutral';
  is_public: boolean;
  user_id: string | null; // null for system avatars
  file_name: string;
  file_size: number;
  upload_source: 'user' | 'system';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Storage Structure
```
avatars/
├── {avatar_name}_{gender}_{userid}_{timestamp}.{ext}
├── paul_male_system_1234567890.png
├── mark_male_system_1234567891.png
├── ashe_female_system_1234567892.png
└── mayra_female_system_1234567893.png
```

## Security Features

### File Upload Security
- ✅ File type validation (JPEG, PNG, GIF only)
- ✅ File size limits (max 5MB)
- ✅ Secure file naming with timestamps
- ✅ User authentication required
- ✅ Proper Firebase Storage permissions

### API Security
- ✅ Firebase ID token authentication
- ✅ User authorization checks
- ✅ Rate limiting support
- ✅ Input validation and sanitization
- ✅ Error handling without information leakage

### Access Control
- ✅ Users can only access public templates and their own
- ✅ System avatars are public by default
- ✅ User uploads are private by default
- ✅ Proper ownership validation

## Performance Optimizations

### Client-Side
- ✅ File validation before upload
- ✅ Efficient filtering and search
- ✅ Pagination for large datasets
- ✅ Caching of frequently accessed data

### Server-Side
- ✅ Efficient Firestore queries
- ✅ Proper indexing support
- ✅ Batch operations for bulk uploads
- ✅ CDN usage for avatar images

## Error Handling

### Upload Errors
```typescript
// File validation errors
{
  "error": "Invalid file type. Only JPEG, PNG, and GIF are allowed."
}

{
  "error": "File size too large. Maximum size is 5MB."
}

// Authentication errors
{
  "error": "Unauthorized"
}
```

### API Errors
```typescript
// Missing parameters
{
  "error": "Missing required fields: file, avatar_name, gender, category"
}

// Invalid values
{
  "error": "Invalid gender value"
}

// Server errors
{
  "error": "Failed to create avatar template"
}
```

## Testing

### Test Script
**File:** `scripts/test-phase2-avatar-integration.ts`

**Test Coverage:**
- ✅ Database structure validation
- ✅ Avatar template fetching
- ✅ Avatar upload functionality
- ✅ API endpoint responses
- ✅ Error handling scenarios

**Run Tests:**
```bash
npm run test-phase2-avatar-integration
```

## Integration with Existing System

### Video Generation Pipeline
The enhanced avatar selection system integrates seamlessly with the existing video generation pipeline:

1. **Avatar Selection**: Users can select from templates or upload custom avatars
2. **State Management**: Avatar selection is stored in the UGC store
3. **Video Generation**: Selected avatar is passed to the generation pipeline
4. **Template Management**: Users can manage their uploaded avatars

### Existing Components
- ✅ Compatible with existing `ImageStep` component
- ✅ Works with current `UGCModal` structure
- ✅ Integrates with existing project management
- ✅ Maintains backward compatibility

## Usage Examples

### Upload Custom Avatar
```typescript
import { uploadAvatarWithFormData } from '@/lib/avatar-upload';

const handleAvatarUpload = async (file: File) => {
  try {
    const result = await uploadAvatarWithFormData({
      file,
      avatarName: 'My Custom Avatar',
      gender: 'male',
      category: 'Professional'
    });
    
    // Update video config
    setUploadedAvatar(result.storage_url);
    
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

### Select Template Avatar
```typescript
import { getPublicAvatarTemplates } from '@/lib/avatar-selection';
import { useUGCStore } from '@/lib/ugc-store';

const { setSelectedAvatar } = useUGCStore();

const handleAvatarSelection = async () => {
  try {
    const avatars = await getPublicAvatarTemplates({
      filters: { gender: 'male' }
    });
    
    if (avatars.length > 0) {
      const selectedAvatar = avatars[0];
      setSelectedAvatar(selectedAvatar.id, selectedAvatar.storage_url);
    }
    
  } catch (error) {
    console.error('Selection failed:', error);
  }
};
```

## Next Steps

### Phase 3: UI Integration
The next phase will focus on:
1. Enhanced `ImageStep` component with dual selection options
2. Avatar upload modal with drag-and-drop support
3. Avatar selection modal with filtering and search
4. Avatar card component for consistent display

### Phase 4: Video Generation Integration
Final phase will include:
1. Integration with video generation pipeline
2. Real-time status updates
3. Error handling and recovery
4. Performance optimizations

## Conclusion

Phase 2 successfully implements a robust and scalable avatar selection API integration layer. The system provides:

- ✅ Complete file upload and management capabilities
- ✅ Advanced filtering and search functionality
- ✅ Secure and performant API endpoints
- ✅ Comprehensive error handling
- ✅ Full integration with existing systems
- ✅ Extensive testing and validation

The implementation follows Firebase best practices and provides a solid foundation for the upcoming UI integration phases. 