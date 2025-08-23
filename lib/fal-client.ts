import { fal } from '@fal-ai/client';
import { FAL_MODELS } from '@/config/fal-models';
import { 
  FalGenerationRequest, 
  FalGenerationResponse, 
  FalModelConfig 
} from '@/types/fal-models';

// Export FAL_MODELS for external use
export { FAL_MODELS };

// Legacy types for backward compatibility
export type IdeogramStyle = 'AUTO' | 'REALISTIC' | 'FICTION';
export type ImageSize = 'square_hd' | 'portrait_16_9' | 'landscape_16_9';

export type FalGenerationParams = {
  prompt: string;
  numImages: number; // 1-4
  referenceImageUrl?: string;
  imageSize?: ImageSize;
  style?: IdeogramStyle;
  renderingSpeed?: 'BALANCED' | 'QUALITY' | 'TURBO';
};

export type FalGenerationResult = {
  requestId: string;
  images: { url: string }[];
};

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

  console.log(`Generating with model: ${request.modelId}`);
  console.log('Input:', JSON.stringify(request.input, null, 2));

  try {
    const result = await fal.subscribe(model.endpoint, {
      input: request.input,
      logs: Boolean(request.onProgress),
      onQueueUpdate: update => {
        if (update.status === 'IN_PROGRESS' && request.onProgress) {
          update.logs.map(l => l.message).forEach(request.onProgress);
        }
      },
    });

    console.log('Generation result:', result);

    return {
      requestId: String(result.requestId),
      output: result.data || {},
      duration: result.data?.duration
    };
  } catch (error) {
    console.error('Fal.ai generation error:', error);
    console.error('Model:', request.modelId);
    console.error('Input:', request.input);
    throw error;
  }
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
  // Validate inputs
  if (!text || text.trim().length === 0) {
    throw new Error('Text is required for TTS generation');
  }

  console.log('Generating TTS with:', { text: text.substring(0, 100) + '...', voice: options.voice || 'Aria' });

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
  // Validate inputs
  if (!imageUrl || !audioUrl) {
    throw new Error('Both imageUrl and audioUrl are required for talking head generation');
  }

  console.log('Generating talking head with:', { imageUrl, audioUrl });

  // Use the exact working format from the test script
  const result = await fal.subscribe('fal-ai/bytedance/omnihuman', {
    input: {
      image_url: imageUrl,
      audio_url: audioUrl
    },
    logs: true,
    onQueueUpdate: (update) => {
      console.log('Queue status:', update.status);
      if (update.status === 'IN_PROGRESS' && onProgress) {
        update.logs.map((log) => log.message).forEach(log => {
          console.log('Log:', log);
          onProgress(log);
        });
      }
    },
  });

  console.log('OmniHuman generation successful!');
  console.log('Request ID:', result.requestId);
  console.log('Video URL:', result.data?.video?.url);
  console.log('Duration:', result.data?.duration, 'seconds');

  return {
    requestId: String(result.requestId),
    output: result.data || {},
    duration: result.data?.duration
  };
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
  const {
    prompt,
    numImages,
    referenceImageUrl,
    imageSize = 'square_hd',
    style = 'AUTO',
    renderingSpeed = 'BALANCED',
  } = params;

  const result = await fal.subscribe('fal-ai/ideogram/character', {
    input: {
      rendering_speed: renderingSpeed,
      style,
      expand_prompt: true,
      num_images: Math.max(1, Math.min(4, numImages)),
      prompt,
      image_size: imageSize,
      reference_image_urls: referenceImageUrl ? [referenceImageUrl] : [],
    },
    logs: Boolean(onProgress),
    onQueueUpdate: update => {
      if (update.status === 'IN_PROGRESS' && onProgress) {
        update.logs.map(l => l.message).forEach(onProgress);
      }
    },
  });

  const images = (result?.data?.images || []).map((img: { url: string }) => ({
    url: img.url,
  })) as { url: string }[];

  return { requestId: String(result.requestId), images };
}
