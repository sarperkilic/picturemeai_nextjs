# Fal.ai Speech and Talking Head Generation Implementation

## Feature Description
Implement fal.ai integration for speech synthesis (ElevenLabs Turbo v2.5) and talking head generation (OmniHuman) with a modular, extensible architecture. When users click "Generate Video", the system will sequentially call both models and create project/render records in the database.

## Technical Requirements

### Fal.ai Models Integration

**ElevenLabs Turbo v2.5 Model:**
- Endpoint: `fal-ai/elevenlabs/tts/turbo-v2.5`
- Input: `{ text: string, voice: string, stability: number, similarity_boost: number, speed: number }`
- Output: `{ audio: { url: string } }`

**OmniHuman Model:**
- Endpoint: `fal-ai/bytedance/omnihuman`
- Input: `{ input: { image_url: string, audio_url: string } }`
- Output: Video with duration information

### Database Schema
Projects and renders collections are already implemented. The system will:
1. Create a new project under `users/{uid}/projects/{projectId}`
2. Create two renders under `users/{uid}/projects/{projectId}/renders/`:
   - TTS render (kind: "tts")
   - Avatar render (kind: "avatar")

## Implementation Phases

### Phase 1: Extensible Fal.ai Client Architecture
**Goal:** Create a modular, extensible fal.ai client that can easily accommodate new models.

**Files to Create/Modify:**

#### 1. Create `types/fal-models.ts`
```typescript
export interface FalModelConfig {
  id: string;
  name: string;
  endpoint: string;
  description: string;
  category: 'tts' | 'avatar' | 'image' | 'video';
  inputSchema: Record<string, any>;
  outputSchema: Record<string, any>;
}

export interface FalModelInput {
  [key: string]: any;
}

export interface FalModelOutput {
  [key: string]: any;
}

export interface FalGenerationRequest {
  modelId: string;
  input: FalModelInput;
  onProgress?: (log: string) => void;
}

export interface FalGenerationResponse {
  requestId: string;
  output: FalModelOutput;
  duration?: number;
}
```

#### 2. Create `config/fal-models.ts`
```typescript
import { FalModelConfig } from '@/types/fal-models';

export const FAL_MODELS: Record<string, FalModelConfig> = {
  'elevenlabs-tts-turbo-v2.5': {
    id: 'elevenlabs-tts-turbo-v2.5',
    name: 'ElevenLabs TTS Turbo v2.5',
    endpoint: 'fal-ai/elevenlabs/tts/turbo-v2.5',
    description: 'High-quality text-to-speech synthesis',
    category: 'tts',
    inputSchema: {
      text: { type: 'string', required: true },
      voice: { type: 'string', default: 'Aria' },
      stability: { type: 'number', default: 0.5 },
      similarity_boost: { type: 'number', default: 0.75 },
      speed: { type: 'number', default: 1 }
    },
    outputSchema: {
      audio: { type: 'object', properties: { url: 'string' } }
    }
  },
  'omnihuman': {
    id: 'omnihuman',
    name: 'OmniHuman Talking Head',
    endpoint: 'fal-ai/bytedance/omnihuman',
    description: 'AI-powered talking head video generation',
    category: 'avatar',
    inputSchema: {
      input: { 
        type: 'object', 
        properties: {
          image_url: { type: 'string', required: true },
          audio_url: { type: 'string', required: true }
        }
      }
    },
    outputSchema: {
      video: { type: 'object', properties: { url: 'string' } },
      duration: { type: 'number' }
    }
  }
};
```

#### 3. Update `lib/fal-client.ts`
```typescript
import { fal } from '@fal-ai/client';
import { FAL_MODELS } from '@/config/fal-models';
import { 
  FalGenerationRequest, 
  FalGenerationResponse, 
  FalModelConfig 
} from '@/types/fal-models';

fal.config({
  proxyUrl: '/api/fal/proxy',
});

// Generic model generation function
export async function generateWithFalModel(
  request: FalGenerationRequest
): Promise<FalGenerationResponse> {
  const model = FAL_MODELS[request.modelId];
  if (!model) {
    throw new Error(`Unknown model: ${request.modelId}`);
  }

  const result = await fal.subscribe(model.endpoint, {
    input: request.input,
    logs: Boolean(request.onProgress),
    onQueueUpdate: update => {
      if (update.status === 'IN_PROGRESS' && request.onProgress) {
        update.logs.map(l => l.message).forEach(request.onProgress);
      }
    },
  });

  return {
    requestId: String(result.requestId),
    output: result.data || {},
    duration: result.data?.duration
  };
}

// Specific model functions for convenience
export async function generateTTS(
  text: string,
  options: {
    voice?: string;
    stability?: number;
    similarity_boost?: number;
    speed?: number;
    onProgress?: (log: string) => void;
  } = {}
): Promise<FalGenerationResponse> {
  return generateWithFalModel({
    modelId: 'elevenlabs-tts-turbo-v2.5',
    input: {
      text,
      voice: options.voice || 'Aria',
      stability: options.stability || 0.5,
      similarity_boost: options.similarity_boost || 0.75,
      speed: options.speed || 1
    },
    onProgress: options.onProgress
  });
}

export async function generateTalkingHead(
  imageUrl: string,
  audioUrl: string,
  onProgress?: (log: string) => void
): Promise<FalGenerationResponse> {
  return generateWithFalModel({
    modelId: 'omnihuman',
    input: {
      input: {
        image_url: imageUrl,
        audio_url: audioUrl
      }
    },
    onProgress
  });
}

// Keep existing functions for backward compatibility
export async function uploadToFal(file: File): Promise<string> {
  const url = await fal.storage.upload(file);
  return url as string;
}

// Legacy function - can be deprecated later
export async function generateWithFal(
  params: FalGenerationParams,
  onProgress?: (log: string) => void
): Promise<FalGenerationResult> {
  // ... existing implementation
}
```

### Phase 2: Video Generation Service
**Goal:** Create a service that orchestrates the two-model generation process and manages project/render lifecycle.

**Files to Create:**

#### 4. Create `lib/video-generation-service.ts`
```typescript
import { generateTTS, generateTalkingHead } from './fal-client';
import { createProject, updateProjectStatus } from './projects';
import { createRender, updateRender, updateRenderStatus } from './renders';
import { CreateProjectData } from '@/types/projects';
import { useSession } from '@/lib/use-firebase-auth';

export interface VideoGenerationConfig {
  script: string;
  voiceId: string;
  avatarId: string;
  imageUrl: string;
}

export interface VideoGenerationResult {
  projectId: string;
  ttsRenderId: string;
  avatarRenderId: string;
  finalVideoUrl?: string;
  duration?: number;
}

export class VideoGenerationService {
  static async generateVideo(
    userId: string,
    config: VideoGenerationConfig,
    onProgress?: (message: string) => void
  ): Promise<VideoGenerationResult> {
    try {
      // Step 1: Create project
      onProgress?.('Creating project...');
      const projectData: CreateProjectData = {
        title: `UGC Video ${Date.now()}`,
        flow: {
          script: config.script,
          voiceId: config.voiceId,
          avatarId: config.avatarId,
        },
        duration: 0, // Will be updated after generation
      };
      
      const project = await createProject(userId, projectData);
      
      // Step 2: Generate TTS
      onProgress?.('Generating speech...');
      const ttsRender = await createRender(userId, project.id, {
        kind: 'tts',
        model: 'elevenlabs-tts-turbo-v2.5',
        providerJobId: '',
        input: {
          text: config.script,
          voice: config.voiceId,
        }
      });
      
      await updateRenderStatus(userId, project.id, ttsRender.id, 'running');
      
      const ttsResult = await generateTTS(config.script, {
        voice: config.voiceId,
        onProgress: (log) => onProgress?.(`TTS: ${log}`)
      });
      
      await updateRender(userId, project.id, ttsRender.id, {
        status: 'succeeded',
        output: ttsResult.output,
        providerJobId: ttsResult.requestId
      });
      
      // Step 3: Generate talking head
      onProgress?.('Generating talking head video...');
      const avatarRender = await createRender(userId, project.id, {
        kind: 'avatar',
        model: 'omnihuman',
        providerJobId: '',
        input: {
          image_url: config.imageUrl,
          audio_url: ttsResult.output.audio.url,
        }
      });
      
      await updateRenderStatus(userId, project.id, avatarRender.id, 'running');
      
      const avatarResult = await generateTalkingHead(
        config.imageUrl,
        ttsResult.output.audio.url,
        (log) => onProgress?.(`Avatar: ${log}`)
      );
      
      await updateRender(userId, project.id, avatarRender.id, {
        status: 'succeeded',
        output: avatarResult.output,
        providerJobId: avatarResult.requestId
      });
      
      // Step 4: Update project with final results
      await updateProjectStatus(userId, project.id, 'complete');
      await updateProject(userId, project.id, {
        duration: avatarResult.duration || 0,
        usedCredits: 1
      });
      
      return {
        projectId: project.id,
        ttsRenderId: ttsRender.id,
        avatarRenderId: avatarRender.id,
        finalVideoUrl: avatarResult.output.video?.url,
        duration: avatarResult.duration
      };
      
    } catch (error) {
      console.error('Video generation failed:', error);
      throw error;
    }
  }
}
```

### Phase 3: UI Integration
**Goal:** Integrate the video generation service with the existing UGC modal and update the dashboard to show real projects.

**Files to Modify:**

#### 5. Update `components/dashboard/UGCModal.tsx`
```typescript
// Add imports
import { VideoGenerationService } from '@/lib/video-generation-service';
import { useSession } from '@/lib/use-firebase-auth';
import { useProjectsStore } from '@/lib/projects-store';

// Update handleGenerate function
const handleGenerate = async () => {
  if (!isAllStepsCompleted() || !user?.id) return;

  setIsGenerating(true);
  try {
    const config = {
      script: videoConfig.audio.text,
      voiceId: videoConfig.audio.voice,
      avatarId: videoConfig.character.avatarId || 'default',
      imageUrl: videoConfig.character.imageUrl || '',
    };

    const result = await VideoGenerationService.generateVideo(
      user.id,
      config,
      (message) => {
        // Could show progress in UI
        console.log(message);
      }
    );

    // Refresh projects in dashboard
    const { fetchProjectsForDashboard } = useProjectsStore.getState();
    await fetchProjectsForDashboard(user.id, 10);

    handleClose();
  } catch (error) {
    console.error('Error generating video:', error);
    // Show error to user
  } finally {
    setIsGenerating(false);
  }
};
```

#### 6. Update `components/dashboard/GeneratedVideosSection.tsx`
```typescript
// Replace mock data with real projects from store
import { useProjectsStore } from '@/lib/projects-store';

export function GeneratedVideosSection() {
  const { user } = useSession();
  const { 
    projects, 
    isLoading, 
    error, 
    fetchProjectsForDashboard 
  } = useProjectsStore();

  useEffect(() => {
    if (user?.id) {
      fetchProjectsForDashboard(user.id, 10);
    }
  }, [user?.id, fetchProjectsForDashboard]);

  // Update the rendering logic to use real projects data
  // Projects will have: id, title, status, duration, flow, usedCredits, createdAt
}
```

### Phase 4: Real-time Status Updates
**Goal:** Implement real-time updates for render status and project completion.

**Files to Create:**

#### 7. Create `lib/projects-realtime.ts`
```typescript
import { onSnapshot, doc, collection } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '@/types/firebase';
import { useProjectsStore } from './projects-store';

export function subscribeToProjectUpdates(
  userId: string,
  projectId: string,
  onUpdate: (project: any, renders: any[]) => void
) {
  // Subscribe to project changes
  const projectRef = doc(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId);
  const rendersRef = collection(db, COLLECTIONS.USERS, userId, COLLECTIONS.PROJECTS, projectId, COLLECTIONS.RENDERS);
  
  const unsubscribeProject = onSnapshot(projectRef, (doc) => {
    const project = doc.exists() ? { id: doc.id, ...doc.data() } : null;
    
    // Get renders for this project
    onSnapshot(rendersRef, (rendersSnapshot) => {
      const renders = rendersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      onUpdate(project, renders);
    });
  });
  
  return unsubscribeProject;
}
```

## Extension Strategy

### Adding New Models
To add a new fal.ai model:

1. **Add model configuration** to `config/fal-models.ts`
2. **Create convenience function** in `lib/fal-client.ts` (optional)
3. **Update video generation service** if needed
4. **Update UI** to support new model options

### Example: Adding a New TTS Model
```typescript
// In config/fal-models.ts
'new-tts-model': {
  id: 'new-tts-model',
  name: 'New TTS Model',
  endpoint: 'fal-ai/new-provider/tts-model',
  description: 'Alternative TTS model',
  category: 'tts',
  inputSchema: { /* ... */ },
  outputSchema: { /* ... */ }
}

// In lib/fal-client.ts
export async function generateWithNewTTS(
  text: string,
  options: any = {}
): Promise<FalGenerationResponse> {
  return generateWithFalModel({
    modelId: 'new-tts-model',
    input: { text, ...options },
    onProgress: options.onProgress
  });
}
```

### Environment Variables
- `FAL_KEY` is set in .env.local
