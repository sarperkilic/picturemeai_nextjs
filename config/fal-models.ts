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
      image_url: { type: 'string', required: true },
      audio_url: { type: 'string', required: true }
    },
    outputSchema: {
      video: { type: 'object', properties: { url: 'string' } },
      duration: { type: 'number' }
    }
  }
}; 