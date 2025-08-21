# UGC Video Generation Dashboard

## Feature Description
Transform the existing image generation dashboard into a video generation (UGC) application with a 2-column layout featuring a menu panel, guidance section, and multi-step configuration popup for video generation.

## Technical Requirements

### Core Dashboard Layout Changes

**Files to Modify:**
- `app/dashboard/DashboardClient.tsx` - Complete rewrite of the main dashboard component
- `components/dashboard/` - Replace existing components with new UGC-specific ones

**Layout Structure:**
- 2-column responsive layout (left menu panel + right main area)
- Left column: Static menu with "UGC Builder" option (narrower)
- Right column: Split into upper (guidance) and lower (generated videos) sections (wider)

### New Components to Create

**Phase 1: Core Dashboard Components**
- `components/dashboard/UGCMenuPanel.tsx` - Left column menu with generation modes
- `components/dashboard/GenerationGuide.tsx` - Upper right section with step-by-step guide
- `components/dashboard/GeneratedVideosSection.tsx` - Lower right section for video assets
- `components/dashboard/StartGenerationButton.tsx` - Primary CTA button

**Phase 2: Configuration Modal Components**
- `components/dashboard/UGCModal.tsx` - Main modal container with navigation
- `components/dashboard/ugc-steps/` - Directory for step components:
  - `TemplateStep.tsx` - Template selection with thumbnail grid
  - `ImageStep.tsx` - Character/avatar selection
  - `ActionStep.tsx` - Character movement configuration
  - `AudioTextStep.tsx` - Script input for character speech
  - `AudioSettingsStep.tsx` - Voice and tone selection
  - `BackgroundStep.tsx` - Background selection/upload

### State Management

**New State Structure:**
- `selectedGenerationMode` - Currently selected menu option ("UGC Builder")
- `isModalOpen` - Controls configuration popup visibility
- `currentStep` - Active step in the multi-step form
- `videoConfig` - Object containing all video generation parameters
- `generatedVideos` - Array of user's previously generated videos

**State Management Files:**
- `lib/ugc-store.ts` - New store for UGC video generation state
- `types/ugc.ts` - TypeScript interfaces for video generation data

### Data Types and Interfaces

**New Type Definitions (`types/ugc.ts`):**
```typescript
interface VideoTemplate {
  id: string;
  name: string;
  thumbnail: string;
  style: string;
  cameraMovement: string;
}

interface VideoConfig {
  template: VideoTemplate | null;
  character: {
    type: 'avatar' | 'upload';
    imageUrl?: string;
    avatarId?: string;
  };
  action: {
    movement: string;
    duration: number;
  };
  audio: {
    text: string;
    voice: string;
    tone: string;
  };
  background: {
    type: 'preset' | 'upload';
    imageUrl?: string;
    presetId?: string;
  };
}

interface GeneratedVideo {
  id: string;
  thumbnail: string;
  videoUrl: string;
  createdAt: Date;
  config: VideoConfig;
}
```

### Multi-Step Form Algorithm

**Step Navigation Logic:**
1. User clicks "Start Generation" → Opens modal with Template step active
2. Template selection → Enables "Next" button when template selected
3. Each step validates required fields before allowing progression
4. Navigation between steps via left menu panel
5. Final step shows "Generate" button instead of "Next"
6. Generate button closes modal and starts video generation process

**Step Validation Rules:**
- Template: Must select one template
- Image: Must upload photo or select avatar
- Action: Must define movement type and duration
- Audio text: Must provide script (minimum 10 characters)
- Audio settings: Must select voice and tone
- Background: Must select preset or upload image

### UI/UX Implementation Details

**Template Selection Grid:**
- Responsive grid layout (3-4 columns on desktop, 2 on tablet, 1 on mobile)
- Each template shows thumbnail preview with hover effects
- Selected template highlighted with green border
- Template information displayed on selection

**Modal Navigation:**
- Left sidebar with step indicators
- Active step highlighted with primary color
- Completed steps marked with checkmark
- Disabled steps for incomplete prerequisites

**Responsive Design:**
- Mobile: Single column layout, modal takes full screen
- Tablet: 2-column layout maintained, modal 90% width
- Desktop: Full 2-column layout, modal 80% width

### API Integration Points

**New API Endpoints (Future Implementation):**
- `POST /api/video-generation/create` - Start video generation
- `GET /api/user/videos` - Fetch user's generated videos
- `POST /api/video-generation/status` - Check generation status

**Temporary Implementation:**
- Mock video generation process with loading states
- Local storage for generated videos during development
- Simulated API responses for testing UI flow

### File Structure Changes

**New Directory Structure:**
```
components/dashboard/
├── UGCMenuPanel.tsx
├── GenerationGuide.tsx
├── GeneratedVideosSection.tsx
├── StartGenerationButton.tsx
├── UGCModal.tsx
└── ugc-steps/
    ├── TemplateStep.tsx
    ├── ImageStep.tsx
    ├── ActionStep.tsx
    ├── AudioTextStep.tsx
    ├── AudioSettingsStep.tsx
    └── BackgroundStep.tsx
```

**New Type Files:**
- `types/ugc.ts` - UGC video generation types
- `lib/ugc-store.ts` - State management for UGC features

### Migration Strategy

**Phase 1: Core Dashboard (Parallel Development)**
- Create new UGC components alongside existing ones
- Implement basic 2-column layout
- Add menu panel and guidance sections

**Phase 2: Configuration Modal (Sequential)**
- Build modal container and navigation
- Implement each step component
- Add form validation and state management

**Phase 3: Integration (Sequential)**
- Replace existing dashboard with new UGC version
- Remove old image generation components
- Update routing and navigation

### Dependencies and Imports

**New Dependencies:**
- No new external dependencies required
- Uses existing HeroUI components (Modal, Card, Button, etc.)
- Leverages existing Firebase authentication and state management

**Component Imports:**
- Reuse existing authentication hooks (`useSession`, `useCreditsStore`)
- Extend existing error handling and loading states
- Maintain consistent styling with current design system 