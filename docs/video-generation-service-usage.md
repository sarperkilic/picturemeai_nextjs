# Video Generation Service Usage Guide

## Overview

!! line 57 and 155 
        voice: config.voiceId,
deleted

config.imageUrl, line 85 

The `VideoGenerationService` orchestrates the complete video generation process by:

1. **Creating a project** in the database
2. **Generating TTS audio** using ElevenLabs Turbo v2.5
3. **Generating talking head video** using OmniHuman
4. **Managing render lifecycle** with proper status updates
5. **Handling errors** and updating failed states

## Service Methods

### `generateVideo()`

The main method for generating videos with basic error handling.

```typescript
import { VideoGenerationService } from '@/lib/video-generation-service';

const result = await VideoGenerationService.generateVideo(
  userId,
  {
    script: "Hello, welcome to our product demo!",
    voiceId: "Aria",
    avatarId: "default-avatar",
    imageUrl: "https://example.com/avatar-image.jpg"
  },
  (message) => console.log('Progress:', message)
);

console.log('Generated video URL:', result.finalVideoUrl);
console.log('Project ID:', result.projectId);
console.log('Duration:', result.duration);
```

### `generateVideoWithErrorHandling()`

Enhanced version with comprehensive error handling that updates database states on failure.

```typescript
import { VideoGenerationService } from '@/lib/video-generation-service';

try {
  const result = await VideoGenerationService.generateVideoWithErrorHandling(
    userId,
    {
      script: "Hello, welcome to our product demo!",
      voiceId: "Aria",
      avatarId: "default-avatar",
      imageUrl: "https://example.com/avatar-image.jpg"
    },
    (message) => {
      // Update UI with progress
      setProgressMessage(message);
    }
  );
  
  // Handle success
  console.log('Video generated successfully:', result.finalVideoUrl);
  
} catch (error) {
  // Handle error - database states are already updated
  console.error('Video generation failed:', error.message);
}
```

## Process Flow

### 1. Project Creation
- Creates a new project with status "draft"
- Stores script, voice, and avatar configuration
- Initializes with 0 duration and 0 used credits

### 2. TTS Generation
- Creates a render record with kind "tts"
- Updates status to "running"
- Calls ElevenLabs TTS API
- Updates render with audio URL and success status

### 3. Talking Head Generation
- Creates a render record with kind "avatar"
- Updates status to "running"
- Calls OmniHuman API with image and audio
- Updates render with video URL and success status

### 4. Project Completion
- Updates project status to "complete"
- Sets final duration and used credits
- Returns complete result object

## Error Handling

The `generateVideoWithErrorHandling()` method provides comprehensive error handling:

- **Project-level errors**: Updates project status to "failed"
- **Render-level errors**: Updates individual render status to "failed"
- **Error messages**: Stores error details in render records
- **Partial failures**: Handles cases where TTS succeeds but avatar fails

## Database Schema

### Project Structure
```typescript
{
  id: string;
  title: string;
  status: "draft" | "ready" | "rendering" | "complete" | "failed";
  flow: {
    script: string;
    voiceId: string;
    avatarId: string;
  };
  duration: number;
  usedCredits: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Render Structure
```typescript
{
  id: string;
  kind: "tts" | "avatar" | "final";
  model: string;
  status: "queued" | "running" | "succeeded" | "failed";
  providerJobId: string;
  input: Record<string, any>;
  output: Record<string, any>;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Integration with UI

### Progress Tracking
```typescript
const [progress, setProgress] = useState<string>('');

const handleGenerate = async () => {
  try {
    const result = await VideoGenerationService.generateVideo(
      user.id,
      config,
      (message) => setProgress(message)
    );
    
    // Handle success
    setProgress('Video generated successfully!');
    
  } catch (error) {
    setProgress(`Error: ${error.message}`);
  }
};
```

### Real-time Updates
The service creates database records that can be monitored in real-time:

```typescript
import { subscribeToProjectUpdates } from '@/lib/projects-realtime';

const unsubscribe = subscribeToProjectUpdates(
  userId,
  projectId,
  (project, renders) => {
    // Update UI with real-time project and render status
    setProject(project);
    setRenders(renders);
  }
);
```

## Configuration Options

### VideoGenerationConfig
```typescript
interface VideoGenerationConfig {
  script: string;        // Text to convert to speech
  voiceId: string;       // ElevenLabs voice ID
  avatarId: string;      // Avatar identifier
  imageUrl: string;      // Avatar image URL
}
```

### VideoGenerationResult
```typescript
interface VideoGenerationResult {
  projectId: string;           // Database project ID
  ttsRenderId: string;         // TTS render ID
  avatarRenderId: string;      // Avatar render ID
  finalVideoUrl?: string;      // Generated video URL
  duration?: number;           // Video duration in seconds
}
```

## Best Practices

1. **Use error handling version**: Always use `generateVideoWithErrorHandling()` in production
2. **Implement progress UI**: Show progress messages to users during generation
3. **Handle timeouts**: Consider implementing timeout handling for long-running generations
4. **Monitor credits**: Track credit usage and implement limits
5. **Validate inputs**: Ensure all required fields are provided before calling the service 