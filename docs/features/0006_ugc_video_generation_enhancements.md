# UGC Video Generation Enhancements

## Feature Description
Enhance the UGC video generation flow to automatically close the popup when generation starts, add new projects to the Generated Videos section in real-time, display avatar thumbnails for each project, and implement video playback functionality when videos are completed.

## Technical Requirements

### Core Enhancement Features

**User Flow:**
1. User clicks "Generate Video" in UGC popup
2. Popup closes immediately
3. New project appears in Generated Videos section with "Processing" status
4. Project thumbnail shows the selected avatar image
5. When video completes, user can click to play video in new popup

### Files to Modify

**Phase 1: Popup Closure and Real-time Updates**

**UGC Modal Enhancement:**
- `components/dashboard/UGCModal.tsx` - Close popup immediately after generation starts
- `lib/ugc-store.ts` - Add state for tracking generation progress

**Real-time Project Updates:**
- `components/dashboard/GeneratedVideosSection.tsx` - Already using real-time updates via `useProjectsRealtime`
- `lib/use-realtime-updates.ts` - Already implemented for project status updates

**Phase 2: Avatar Thumbnail Integration**

**Avatar Template Integration:**
- `components/dashboard/GeneratedVideosSection.tsx` - Fetch and display avatar thumbnails
- `lib/templates.ts` - Already has `getAvatarTemplate()` function
- `types/templates.ts` - Already has `AvatarTemplate` interface

**Phase 3: Video Player Implementation**

**Video Player Modal:**
- `components/dashboard/VideoPlayerModal.tsx` - New component for video playback
- `components/dashboard/GeneratedVideosSection.tsx` - Add video player integration

### Implementation Algorithm

**Avatar Thumbnail Display Process:**
1. For each project in GeneratedVideosSection:
   - Extract `avatarId` from `project.flow.avatarId`
   - Query `/templates/avatars/avatars/{avatarId}` using `getAvatarTemplate()`
   - Get `storage_url` from avatar template
   - Display as project thumbnail

**Video Player Integration:**
1. When user clicks play button on completed video:
   - Get video URL from project renders (final render output)
   - Open VideoPlayerModal with video URL
   - Display video with controls in modal

**Real-time Status Updates:**
1. `useProjectsRealtime` already provides real-time project updates
2. New projects appear immediately after creation
3. Status changes from "rendering" to "complete" trigger UI updates
4. Thumbnail changes from processing indicator to avatar image

### Database Schema

**Existing Project Structure (already implemented):**
```typescript
interface Project {
  id: string;
  title: string;
  status: "draft" | "ready" | "rendering" | "complete" | "failed";
  duration: number;
  flow: {
    script: string;
    voiceId: string;
    avatarId: string; // This is the key field for avatar lookup
  };
  usedCredits: number;
  createdAt: any;
  updatedAt: any;
}
```

**Existing Avatar Template Structure (already implemented):**
```typescript
interface AvatarTemplate {
  id: string;
  avatar_name: string;
  storage_url: string; // This is the thumbnail URL
  category: string;
  gender: 'male' | 'female' | 'neutral';
  is_public: boolean;
  user_id: string | null;
  file_name: string;
  file_size: number;
  upload_source: 'user' | 'system';
  created_at: Timestamp;
  updated_at: Timestamp;
}
```

### Component Modifications

**1. Enhanced UGCModal.tsx**
```typescript
const handleGenerate = async () => {
  if (!user?.id) return;

  setIsGenerating(true);
  try {
    // Start video generation
    const config = {
      script: videoConfig.audio.text,
      voiceId: videoConfig.audio.voice,
      avatarId: videoConfig.character.avatarId || 'default',
      imageUrl: videoConfig.character.imageUrl || '',
    };

    // Close modal immediately after starting generation
    handleClose();

    // Generate video in background
    const result = await VideoGenerationService.generateVideoWithErrorHandling(
      user.id,
      config,
      (message) => {
        // Progress messages could be shown in a toast or status bar
        console.log(message);
      }
    );

    // Refresh projects to show new project
    await fetchProjectsForDashboard(user.id, 10);
    
  } catch (error) {
    console.error('Error generating video:', error);
    // Show error toast
  } finally {
    setIsGenerating(false);
  }
};
```

**2. Enhanced GeneratedVideosSection.tsx**
```typescript
// Add avatar thumbnail fetching
const [avatarThumbnails, setAvatarThumbnails] = useState<Record<string, string>>({});

// Fetch avatar thumbnails for projects
useEffect(() => {
  const fetchAvatarThumbnails = async () => {
    const thumbnails: Record<string, string> = {};
    
    for (const project of projects) {
      if (project.flow?.avatarId) {
        try {
          const avatarTemplate = await getAvatarTemplate(project.flow.avatarId);
          if (avatarTemplate) {
            thumbnails[project.id] = avatarTemplate.storage_url;
          }
        } catch (error) {
          console.error(`Failed to fetch avatar for project ${project.id}:`, error);
        }
      }
    }
    
    setAvatarThumbnails(thumbnails);
  };

  if (projects.length > 0) {
    fetchAvatarThumbnails();
  }
}, [projects]);

// Update thumbnail display
<img
  src={avatarThumbnails[project.id] || '/images/sample1.png'}
  alt={project.title}
  className='w-full h-full object-cover rounded-lg'
/>
```

**3. New VideoPlayerModal.tsx**
```typescript
interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  title: string;
}

export function VideoPlayerModal({ isOpen, onClose, videoUrl, title }: VideoPlayerModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalContent>
        <ModalHeader>
          <h3>{title}</h3>
        </ModalHeader>
        <ModalBody>
          <video
            controls
            className="w-full h-auto"
            src={videoUrl}
            poster="/images/video-placeholder.png"
          >
            Your browser does not support the video tag.
          </video>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
```

### Error Handling

**Avatar Thumbnail Fallbacks:**
- If avatar template fetch fails, use default placeholder image
- If `avatarId` is missing, use default avatar
- Loading state while fetching avatar thumbnails

**Video Player Error Handling:**
- Check if video URL exists before opening player
- Handle video loading errors
- Fallback message if video cannot be played

**Real-time Update Error Handling:**
- Graceful degradation if real-time updates fail
- Fallback to polling for project status updates
- Error boundaries for component failures

### Performance Considerations

**Avatar Thumbnail Optimization:**
- Cache avatar thumbnails in component state
- Only fetch avatars for visible projects
- Lazy load thumbnails as projects come into view

**Video Player Performance:**
- Lazy load video player modal
- Preload video metadata only when needed
- Optimize video format and compression

### Security Considerations

**Avatar Template Access:**
- Verify user has access to avatar templates
- Handle private avatar permissions
- Sanitize avatar URLs before display

**Video URL Security:**
- Validate video URLs before playback
- Ensure videos are from trusted sources
- Implement proper CORS headers for video serving

### Testing Requirements

**Unit Tests:**
- Avatar thumbnail fetching logic
- Video player modal functionality
- Real-time update handling

**Integration Tests:**
- End-to-end video generation flow
- Avatar thumbnail display
- Video playback functionality

**User Acceptance Tests:**
- Popup closes immediately after generation start
- New projects appear in real-time
- Avatar thumbnails display correctly
- Video player opens and plays videos 