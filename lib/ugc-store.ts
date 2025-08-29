import { create } from 'zustand';

import {
  type UGCState,
  type GenerationMode,
  type VideoConfig,
  type GeneratedVideo,
} from '@/types/ugc';
import { Project } from '@/types/firebase';

interface UGCActions {
  setSelectedGenerationMode: (mode: GenerationMode) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setCurrentStep: (step: number) => void;
  updateVideoConfig: (config: Partial<VideoConfig>) => void;
  addGeneratedVideo: (video: GeneratedVideo) => void;
  resetVideoConfig: () => void;
  resetState: () => void;
  setCurrentProject: (project: Project | null) => void;
  // Avatar selection specific actions
  setSelectedAvatar: (avatarId: string, imageUrl: string) => void;
  setUploadedAvatar: (imageUrl: string) => void;
  clearAvatarSelection: () => void;
  // Validation helper
  validateVideoConfig: () => { isValid: boolean; errors: string[] };
  // Toast notifications
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

const initialVideoConfig: VideoConfig = {
  character: {
    type: 'avatar',
  },
  audio: {
    text: '',
    voice: '',
  },
};

const initialState: UGCState = {
  selectedGenerationMode: 'UGC Builder',
  isModalOpen: false,
  currentStep: 0,
  videoConfig: initialVideoConfig,
  generatedVideos: [],
  currentProject: null,
  toast: {
    message: '',
    type: 'info',
    isVisible: false,
  },
};

export const useUGCStore = create<UGCState & UGCActions>((set, get) => ({
  ...initialState,

  setSelectedGenerationMode: mode => {
    set({ selectedGenerationMode: mode });
  },

  setIsModalOpen: isOpen => {
    set({ isModalOpen: isOpen });
  },

  setCurrentStep: step => {
    set({ currentStep: step });
  },

  updateVideoConfig: config => {
    set(state => ({
      videoConfig: { ...state.videoConfig, ...config },
    }));
  },

  addGeneratedVideo: video => {
    set(state => ({
      generatedVideos: [video, ...state.generatedVideos],
    }));
  },

  resetVideoConfig: () => {
    set({ videoConfig: initialVideoConfig });
  },

  resetState: () => {
    set(initialState);
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  // Avatar selection specific actions
  setSelectedAvatar: (avatarId: string, imageUrl: string) => {
    set(state => ({
      videoConfig: {
        ...state.videoConfig,
        character: {
          type: 'avatar',
          avatarId,
          imageUrl,
        },
      },
    }));
  },

  setUploadedAvatar: (imageUrl: string) => {
    set(state => ({
      videoConfig: {
        ...state.videoConfig,
        character: {
          type: 'upload',
          imageUrl,
        },
      },
    }));
  },

  clearAvatarSelection: () => {
    set(state => ({
      videoConfig: {
        ...state.videoConfig,
        character: {
          type: 'avatar',
        },
      },
    }));
  },

  // Validation helper
  validateVideoConfig: () => {
    const state = get();
    const { character, audio } = state.videoConfig;
    
    const errors: string[] = [];
    
    // Validate character selection
    if (character.type === 'avatar' && !character.avatarId) {
      errors.push('Please select an avatar');
    } else if (character.type === 'upload' && !character.imageUrl) {
      errors.push('Please upload an image');
    }
    
    // Validate audio
    if (!audio.text || audio.text.length < 10) {
      errors.push('Script must be at least 10 characters long');
    }
    
    if (!audio.voice) {
      errors.push('Please select a voice');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },

  // Voice selection helper
  setSelectedVoice: (voiceId: string, voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    speed?: number;
  }) => {
    set(state => ({
      videoConfig: {
        ...state.videoConfig,
        audio: {
          ...state.videoConfig.audio,
          voice: voiceId,
          voiceSettings,
        },
      },
    }));
  },

  // Toast notifications
  showToast: (message: string, type: 'success' | 'error' | 'info') => {
    set({
      toast: {
        message,
        type,
        isVisible: true,
      },
    });
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      get().hideToast();
    }, 5000);
  },

  hideToast: () => {
    set({
      toast: {
        message: '',
        type: 'info',
        isVisible: false,
      },
    });
  },


}));
