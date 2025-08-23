import { create } from 'zustand';

import {
  type UGCState,
  type GenerationMode,
  type VideoConfig,
  type GeneratedVideo,
} from '@/types/ugc';

interface UGCActions {
  setSelectedGenerationMode: (mode: GenerationMode) => void;
  setIsModalOpen: (isOpen: boolean) => void;
  setCurrentStep: (step: number) => void;
  updateVideoConfig: (config: Partial<VideoConfig>) => void;
  addGeneratedVideo: (video: GeneratedVideo) => void;
  resetVideoConfig: () => void;
  resetState: () => void;
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
};

export const useUGCStore = create<UGCState & UGCActions>((set, _get) => ({
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
}));
