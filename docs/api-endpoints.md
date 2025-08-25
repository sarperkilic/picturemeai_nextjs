# API Endpoints Documentation

## Overview
This document describes the REST API endpoints for project and render management in the PictureMeAI application.

## Authentication
All API endpoints require authentication using Bearer tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your-firebase-id-token>
```

## Base URL
```
https://your-domain.com/api
```

## Endpoints Summary

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/projects` | List user's projects | Yes |
| POST | `/projects` | Create new project | Yes |
| GET | `/projects/[projectId]` | Get project details | Yes |
| PUT | `/projects/[projectId]` | Update project | Yes |
| DELETE | `/projects/[projectId]` | Delete project | Yes |
| PUT | `/projects/[projectId]/status` | Update project status | Yes |
| GET | `/projects/[projectId]/renders` | List project renders | Yes |
| POST | `/projects/[projectId]/renders` | Create new render | Yes |
| GET | `/projects/[projectId]/renders/[renderId]` | Get render details | Yes |
| PUT | `/projects/[projectId]/renders/[renderId]` | Update render | Yes |
| DELETE | `/projects/[projectId]/renders/[renderId]` | Delete render | Yes |
| GET | `/projects/[projectId]/video` | Get video URL for completed project | Yes |
| GET | `/analytics/renders` | Get render analytics | Admin only |
| GET | `/templates` | List avatar templates | Yes |
| POST | `/templates` | Create new avatar template | Yes |
| GET | `/templates/avatars` | List avatar templates with filtering | Yes |
| GET | `/templates/avatars/categories` | Get available avatar categories | Yes |
| POST | `/templates/avatars/upload` | Upload avatar with file | Yes |
| GET | `/templates/avatars/[avatarId]` | Get specific avatar template | Yes |
| PUT | `/templates/avatars/[avatarId]` | Update avatar template | Yes |
| DELETE | `/templates/avatars/[avatarId]` | Delete avatar template | Yes |

## Project Endpoints

### GET /projects
List all projects for the authenticated user.

**Query Parameters:**
- `limit` (optional): Number of projects to return (default: 50, max: 100)

**Response:**
```json
{
  "success": true,
  "projects": [
    {
      "id": "project_123",
      "title": "My UGC Video",
      "status": "draft",
      "duration": 15,
      "flow": {
        "script": "Welcome to our product demo...",
        "voiceId": "voice_123",
        "avatarId": "avatar_456"
      },
      "usedCredits": 0,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /projects
Create a new project.

**Request Body:**
```json
{
  "title": "My UGC Video",
  "flow": {
    "script": "Welcome to our product demo...",
    "voiceId": "voice_123",
    "avatarId": "avatar_456"
  },
  "duration": 15
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "project_123",
    "title": "My UGC Video",
    "status": "draft",
    "duration": 15,
    "flow": {
      "script": "Welcome to our product demo...",
      "voiceId": "voice_123",
      "avatarId": "avatar_456"
    },
    "usedCredits": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /projects/[projectId]
Get details of a specific project.

**Response:**
```json
{
  "success": true,
  "project": {
    "id": "project_123",
    "title": "My UGC Video",
    "status": "draft",
    "duration": 15,
    "flow": {
      "script": "Welcome to our product demo...",
      "voiceId": "voice_123",
      "avatarId": "avatar_456"
    },
    "usedCredits": 0,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /projects/[projectId]
Update a project.

**Request Body:**
```json
{
  "title": "Updated UGC Video",
  "status": "ready",
  "duration": 20,
  "flow": {
    "script": "Updated script...",
    "voiceId": "voice_789",
    "avatarId": "avatar_012"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Project updated successfully"
}
```

### DELETE /projects/[projectId]
Delete a project and all its renders.

**Response:**
```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

### PUT /projects/[projectId]/status
Update the status of a project.

**Request Body:**
```json
{
  "status": "rendering"
}
```

**Valid Status Values:**
- `draft`: Project is being created/edited
- `ready`: Project is ready for rendering
- `rendering`: Project is currently being rendered
- `complete`: Project rendering is complete
- `failed`: Project rendering failed

**Response:**
```json
{
  "success": true,
  "message": "Project status updated successfully",
  "status": "rendering"
}
```

## Render Endpoints

### GET /projects/[projectId]/renders
List all renders for a specific project.

**Response:**
```json
{
  "success": true,
  "renders": [
    {
      "id": "render_123",
      "kind": "tts",
      "model": "elevenlabs",
      "providerJobId": "job_789",
      "status": "succeeded",
      "input": {
        "text": "Welcome to our product demo...",
        "voice": "voice_123"
      },
      "output": {
        "audioUrl": "https://example.com/audio.mp3"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /projects/[projectId]/renders
Create a new render for a project.

**Request Body:**
```json
{
  "kind": "tts",
  "model": "elevenlabs",
  "providerJobId": "job_789",
  "input": {
    "text": "Welcome to our product demo...",
    "voice": "voice_123"
  }
}
```

**Valid Render Kinds:**
- `tts`: Text-to-speech generation
- `avatar`: Avatar video generation
- `final`: Final video composition

**Response:**
```json
{
  "success": true,
  "render": {
    "id": "render_123",
    "kind": "tts",
    "model": "elevenlabs",
    "providerJobId": "job_789",
    "status": "queued",
    "input": {
      "text": "Welcome to our product demo...",
      "voice": "voice_123"
    },
    "output": {},
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### GET /projects/[projectId]/renders/[renderId]
Get details of a specific render.

**Response:**
```json
{
  "success": true,
  "render": {
    "id": "render_123",
    "kind": "tts",
    "model": "elevenlabs",
    "providerJobId": "job_789",
    "status": "succeeded",
    "input": {
      "text": "Welcome to our product demo...",
      "voice": "voice_123"
    },
    "output": {
      "audioUrl": "https://example.com/audio.mp3"
    },
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /projects/[projectId]/renders/[renderId]
Update a render.

**Request Body:**
```json
{
  "status": "succeeded",
  "output": {
    "audioUrl": "https://example.com/audio.mp3"
  }
}
```

**Valid Render Status Values:**
- `queued`: Render is waiting to be processed
- `running`: Render is currently being processed
- `succeeded`: Render completed successfully
- `failed`: Render failed

**Response:**
```json
{
  "success": true,
  "message": "Render updated successfully"
}
```

### DELETE /projects/[projectId]/renders/[renderId]
Delete a specific render.

**Response:**
```json
{
  "success": true,
  "message": "Render deleted successfully"
}
```

### GET /projects/[projectId]/video
Get the video URL for a completed project. This endpoint retrieves the final video URL from the avatar render output.

**Requirements:**
- Project must be owned by the authenticated user
- Project status must be "complete"
- Avatar render must exist and have status "succeeded"

**Response:**
```json
{
  "success": true,
  "data": {
    "videoUrl": "https://v3.fal.media/files/kangaroo/6DYXHYkuVPK1qIMetEpcy_video.mp4",
    "duration": 3.056313
  }
}
```

**Error Responses:**

**404 Not Found:**
```json
{
  "error": "Project not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Video not ready yet"
}
```

**404 Not Found:**
```json
{
  "error": "Video render not found"
}
```

**404 Not Found:**
```json
{
  "error": "Video URL not available"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch video"
}
```

**Usage Example:**
```javascript
// Get video URL for a completed project
const response = await fetch(`/api/projects/${projectId}/video`, {
  headers: {
    'Authorization': `Bearer ${idToken}`,
  },
});

if (response.ok) {
  const data = await response.json();
  const videoUrl = data.data.videoUrl;
  const duration = data.data.duration;
  // Use videoUrl in video player
}
```

## Analytics Endpoints

### GET /analytics/renders
Get render analytics (admin only).

**Query Parameters:**
- `type`: Type of analytics to retrieve
  - `failed-last-24h`: Get failed renders from the last 24 hours
  - `by-provider`: Get renders by provider (requires `provider` parameter)
- `provider`: Provider name (required when `type=by-provider`)

**Examples:**
```
GET /analytics/renders?type=failed-last-24h
GET /analytics/renders?type=by-provider&provider=elevenlabs
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "render_123",
      "kind": "tts",
      "model": "elevenlabs",
      "status": "failed",
      "error": "Provider timeout",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

## Template Endpoints

### Database Structure
The avatar templates are stored in Firestore using the following structure:
```
templates/avatars/avatars/{avatarId}
├── avatar_name: string
├── storage_url: string
├── category: string
├── gender: "male" | "female" | "neutral"
├── is_public: boolean
├── user_id: string | null (null for system avatars)
├── file_name: string
├── file_size: number
├── upload_source: "user" | "system"
├── created_at: Timestamp
└── updated_at: Timestamp
```

**Note:** The double "avatars" subcollection structure (`templates/avatars/avatars/{avatarId}`) is the current implementation. This structure allows for future expansion to other template types while keeping avatar templates organized.

### Implementation Status
✅ **Phase 2: Enhanced Avatar Selection API Integration - COMPLETED**
- Database structure: `templates/avatars/avatars/{avatarId}` ✅
- Enhanced upload API with multipart form data support ✅
- Avatar categories endpoint ✅
- User avatar support and ownership ✅
- Advanced filtering and search ✅
- File validation and security ✅
- 4 system avatar templates uploaded and accessible ✅

**Current Templates:**
- Paul (male) - System avatar
- Mark (male) - System avatar  
- Ashe (female) - System avatar
- Mayra (female) - System avatar

### GET /templates
List all avatar templates with filtering and pagination.

**Query Parameters:**
- `limit` (optional): Number of templates to return (default: 50, max: 100)
- `offset` (optional): Number of templates to skip (default: 0)
- `orderBy` (optional): Field to order by (default: "created_at", options: "created_at", "avatar_name")
- `orderDirection` (optional): Order direction (default: "desc", options: "asc", "desc")
- `gender` (optional): Filter by gender ("male", "female", "neutral")
- `category` (optional): Filter by category
- `is_public` (optional): Filter by public status (true/false)
- `user_id` (optional): Filter by user ID

**Examples:**
```
GET /templates?limit=20&gender=female&is_public=true
GET /templates?orderBy=avatar_name&orderDirection=asc
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "avatar_123",
      "avatar_name": "Sarah",
      "storage_url": "https://storage.googleapis.com/bucket/avatars/sarah.png",
      "category": "avatar",
      "gender": "female",
      "is_public": true,
      "user_id": null,
      "file_name": "sarah.png",
      "file_size": 245760,
      "upload_source": "system",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /templates
Create a new avatar template.

**Request Body:**
```json
{
  "avatar_name": "John",
  "storage_url": "https://storage.googleapis.com/bucket/avatars/john.png",
  "category": "avatar",
  "gender": "male",
  "is_public": true,
  "file_name": "john.png",
  "file_size": 198432,
  "upload_source": "user"
}
```

**Required Fields:**
- `avatar_name`: Name of the avatar
- `storage_url`: Firebase Storage URL of the avatar image
- `category`: Category of the avatar (e.g., "avatar")
- `gender`: Gender of the avatar ("male", "female", "neutral")
- `file_name`: Original filename
- `file_size`: File size in bytes
- `upload_source`: Source of upload ("user" or "system")

**Optional Fields:**
- `is_public`: Whether the template is public (default: false)
- `user_id`: User ID who owns the template (default: current user)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "avatar_456"
  },
  "message": "Template created successfully"
}
```

### GET /templates/avatars
List avatar templates with advanced filtering options.

**Query Parameters:**
- `limit` (optional): Number of templates to return (default: 50)
- `offset` (optional): Number of templates to skip (default: 0)
- `orderBy` (optional): Field to order by (default: "created_at")
- `orderDirection` (optional): Order direction (default: "desc")
- `gender` (optional): Filter by gender ("male", "female", "neutral")
- `category` (optional): Filter by category
- `search` (optional): Search by avatar name or category
- `type` (optional): Type of filtering (default: "public", options: "public", "user", "gender")

**Type Filtering:**
- `public`: Get all public avatar templates
- `user`: Get current user's avatar templates
- `gender`: Get public avatars by gender (requires `gender` parameter)

**Examples:**
```
GET /templates/avatars?type=public&limit=10
GET /templates/avatars?type=user
GET /templates/avatars?type=gender&gender=female
GET /templates/avatars?search=paul&type=public
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "avatar_123",
      "avatar_name": "Sarah",
      "storage_url": "https://storage.googleapis.com/bucket/avatars/sarah.png",
      "category": "avatar",
      "gender": "female",
      "is_public": true,
      "user_id": null,
      "file_name": "sarah.png",
      "file_size": 245760,
      "upload_source": "system",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1,
  "type": "public"
}
```

### GET /templates/avatars/categories
Get available avatar categories.

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

### POST /templates/avatars/upload
Upload avatar with file (multipart form data).

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (required): Image file (JPEG, PNG, GIF, max 5MB)
- `avatar_name` (required): Name of the avatar
- `gender` (required): "male", "female", or "neutral"
- `category` (required): Category of the avatar

**File Validation:**
- Allowed types: JPEG, JPG, PNG, GIF
- Maximum size: 5MB
- Minimum dimensions: 200x200 pixels
- Maximum dimensions: 2000x2000 pixels

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "avatar_123",
    "storage_url": "https://storage.googleapis.com/bucket/avatars/avatar_name_male_userid_timestamp.png",
    "avatar_name": "My Avatar"
  },
  "message": "Avatar uploaded successfully"
}
```

**Alternative JSON Request (for backward compatibility):**
```json
{
  "avatar_name": "John",
  "storage_url": "https://storage.googleapis.com/bucket/avatars/john.png",
  "category": "avatar",
  "gender": "male",
  "file_name": "john.png",
  "file_size": 198432,
  "upload_source": "user"
}
```

### GET /templates/avatars/[avatarId]
Get details of a specific avatar template.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "avatar_123",
    "avatar_name": "Sarah",
    "storage_url": "https://storage.googleapis.com/bucket/avatars/sarah.png",
    "category": "avatar",
    "gender": "female",
    "is_public": true,
    "user_id": null,
    "file_name": "sarah.png",
    "file_size": 245760,
    "upload_source": "system",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
}
```

### PUT /templates/avatars/[avatarId]
Update an avatar template. Users can only update their own templates.

**Request Body:**
```json
{
  "avatar_name": "Updated Sarah",
  "category": "professional",
  "gender": "female",
  "is_public": false
}
```

**Updatable Fields:**
- `avatar_name`: Name of the avatar
- `category`: Category of the avatar
- `gender`: Gender of the avatar ("male", "female", "neutral")
- `is_public`: Whether the template is public

**Response:**
```json
{
  "success": true,
  "message": "Avatar template updated successfully"
}
```

### DELETE /templates/avatars/[avatarId]
Delete an avatar template. Users can only delete their own templates.

**Response:**
```json
{
  "success": true,
  "message": "Avatar template deleted successfully"
}
```

## Error Responses

All endpoints return consistent error responses:

**401 Unauthorized:**
```json
{
  "error": "Unauthorized"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden"
}
{
  "error": "Forbidden: You can only update your own templates"
}
{
  "error": "Forbidden: You can only delete your own templates"
}
```

**404 Not Found:**
```json
{
  "error": "Project not found"
}
{
  "error": "Avatar template not found"
}
```

**400 Bad Request:**
```json
{
  "error": "Missing required fields: title, flow.script, flow.voiceId, flow.avatarId"
}
```

**Template-specific 400 errors:**
```json
{
  "error": "Missing required field: avatar_name"
}
{
  "error": "Gender parameter required for gender type"
}
{
  "error": "Invalid file type. Only JPEG, PNG, and GIF are allowed."
}
{
  "error": "File size too large. Maximum size is 5MB."
}
{
  "error": "Missing required fields: file, avatar_name, gender, category"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Failed to fetch projects"
}
{
  "error": "Failed to get templates"
}
{
  "error": "Failed to create template"
}
{
  "error": "Failed to get avatar templates"
}
{
  "error": "Failed to get avatar template"
}
{
  "error": "Failed to update avatar template"
}
{
  "error": "Failed to delete avatar template"
}
{
  "error": "Failed to create avatar template"
}
```

## Rate Limiting
- All endpoints are subject to rate limiting
- Rate limits are applied per user and per endpoint
- Exceeded rate limits return 429 Too Many Requests

## Security Features

### File Upload Security
- File type validation (JPEG, PNG, GIF only)
- File size limits (max 5MB)
- Secure file naming with timestamps and user IDs
- User authentication required
- Proper Firebase Storage permissions

### API Security
- Firebase ID token authentication
- User authorization checks
- Rate limiting support
- Input validation and sanitization
- Error handling without information leakage

### Access Control
- Users can only access public templates and their own
- System avatars are public by default
- User uploads are private by default
- Proper ownership validation

## Performance Optimizations

### Client-Side
- File validation before upload
- Efficient filtering and search
- Pagination for large datasets
- Caching of frequently accessed data

### Server-Side
- Efficient Firestore queries
- Proper indexing support
- Batch operations for bulk uploads
- CDN usage for avatar images

## Known Issues and Troubleshooting

### Firestore Index Requirements
Some queries may require composite indexes in Firestore. If you encounter index errors, create the following indexes in the Firebase Console:

**For ordering queries with filters:**
- Collection: `templates/avatars/avatars`
- Fields: `is_public` (Ascending), `avatar_name` (Ascending), `__name__` (Ascending)

**For gender filtering with ordering:**
- Collection: `templates/avatars/avatars`  
- Fields: `gender` (Ascending), `is_public` (Ascending), `created_at` (Descending)

**For user filtering with ordering:**
- Collection: `templates/avatars/avatars`
- Fields: `user_id` (Ascending), `created_at` (Descending)

### Authentication Notes
- API endpoints require Firebase ID tokens (not custom tokens)
- Use the Firebase client SDK to get proper ID tokens for testing
- Custom tokens will result in 401 Unauthorized errors

### Database Structure Notes
- Templates are stored in `templates/avatars/avatars/{avatarId}` structure
- System avatars have `user_id: null` and `upload_source: "system"`
- User-uploaded avatars have `user_id: <user_uid>` and `upload_source: "user"`
- All system avatars are public by default

## Testing

### Test Scripts
```bash
# Test Phase 2 avatar integration
npm run verify-avatar-api

# Test comprehensive avatar functionality
npm run test-phase2-avatar-integration
```

### Manual Testing
1. Test file upload with different file types and sizes
2. Verify user avatar ownership and access control
3. Test filtering and search functionality
4. Verify category endpoint returns correct data
5. Test error handling for invalid requests

## UGC Video Generation Enhancements

### Overview
The UGC Video Generation feature provides a complete workflow for creating talking head videos with avatar selection, real-time progress tracking, and video playback functionality.

### Feature Components

#### Phase 1: Popup Closure and Real-time Updates
- **UGC Modal**: Closes immediately when video generation starts
- **Real-time Updates**: Projects appear in dashboard as they're being processed
- **Toast Notifications**: Success and error feedback for users
- **Background Processing**: Video generation continues after modal closes

#### Phase 2: Avatar Thumbnail Integration
- **Avatar Thumbnails**: Each project displays its own avatar image as thumbnail
- **Template Integration**: Fetches avatar templates from `/templates/avatars/avatars/{avatarId}`
- **Smart Loading**: Shows loading states and fallback images
- **Real-time Updates**: Thumbnails update as projects complete

#### Phase 3: Video Player Implementation
- **Video Player Modal**: Full-featured video playback with controls
- **Video API Endpoint**: `/api/projects/{projectId}/video` for video URL retrieval
- **Download & Share**: Built-in download and sharing functionality
- **Project Information**: Displays project details and original script

### Database Structure
```
users/{userId}/
├── projects/{projectId}/
│   ├── title: string
│   ├── status: "draft" | "ready" | "rendering" | "complete" | "failed"
│   ├── duration: number
│   ├── flow: {
│   │   ├── script: string
│   │   ├── voiceId: string
│   │   └── avatarId: string
│   │   }
│   ├── usedCredits: number
│   ├── createdAt: Timestamp
│   └── updatedAt: Timestamp
│   └── renders/{renderId}/
│       ├── kind: "tts" | "avatar"
│       ├── model: string
│       ├── status: "queued" | "running" | "succeeded" | "failed"
│       ├── input: Record<string, any>
│       ├── output: {
│       │   ├── audio?: { url: string } (for TTS renders)
│       │   └── video?: { url: string } (for avatar renders)
│       │   }
│       ├── providerJobId: string
│       ├── createdAt: Timestamp
│       └── updatedAt: Timestamp
```

### Video Generation Process
1. **Project Creation**: Creates project with status "draft"
2. **TTS Generation**: Creates TTS render and generates audio
3. **Avatar Generation**: Creates avatar render and generates video
4. **Project Completion**: Updates project status to "complete"
5. **Video Playback**: Video URL available via `/api/projects/{projectId}/video`

### Integration Points
- **UGC Modal**: `components/dashboard/UGCModal.tsx`
- **Generated Videos Section**: `components/dashboard/GeneratedVideosSection.tsx`
- **Video Player**: `components/dashboard/VideoPlayerModal.tsx`
- **Video API**: `app/api/projects/[projectId]/video/route.ts`
- **Toast Notifications**: `components/toast-notification.tsx`

## Next Steps
1. Test all API endpoints with Postman or similar tool
2. Verify authentication and authorization work correctly
3. Test error handling and validation
4. Implement rate limiting if needed
5. Add comprehensive logging and monitoring
6. Create required Firestore indexes for optimal performance
7. Phase 3: UI Integration with enhanced avatar selection components 