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
| GET | `/analytics/renders` | Get render analytics | Admin only |
| GET | `/templates` | List avatar templates | Yes |
| POST | `/templates` | Create new avatar template | Yes |
| GET | `/templates/avatars` | List avatar templates with filtering | Yes |
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
  "file_size": 198432
}
```

**Required Fields:**
- `avatar_name`: Name of the avatar
- `storage_url`: Firebase Storage URL of the avatar image
- `category`: Category of the avatar (e.g., "avatar")
- `gender`: Gender of the avatar ("male", "female", "neutral")
- `file_name`: Original filename
- `file_size`: File size in bytes

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
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1,
  "type": "public"
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
```

## Rate Limiting
- All endpoints are subject to rate limiting
- Rate limits are applied per user and per endpoint
- Exceeded rate limits return 429 Too Many Requests

## Next Steps
1. Test all API endpoints with Postman or similar tool
2. Verify authentication and authorization work correctly
3. Test error handling and validation
4. Implement rate limiting if needed
5. Add comprehensive logging and monitoring 