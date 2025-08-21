export interface VideoTemplate {
  id: string;
  name: string;
  thumbnail: string;
  style: string;
  cameraMovement: string;
}

export interface VideoConfig {
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

export interface GeneratedVideo {
  id: string;
  thumbnail: string;
  videoUrl: string;
  createdAt: Date;
  config: VideoConfig;
}

export type GenerationMode =
  | 'UGC Builder'
  | 'Template Library'
  | 'Custom Video';

export interface UGCState {
  selectedGenerationMode: GenerationMode;
  isModalOpen: boolean;
  currentStep: number;
  videoConfig: VideoConfig;
  generatedVideos: GeneratedVideo[];
}
