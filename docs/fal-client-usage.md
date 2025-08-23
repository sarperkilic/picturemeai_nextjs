# Fal.ai Client Usage Guide

## Overview

The fal.ai client has been refactored to provide a modular, extensible architecture that can easily accommodate new models. The implementation includes:

- **Generic model generation function**: `generateWithFalModel()`
- **Model configuration system**: Centralized model definitions in `config/fal-models.ts`
- **Type-safe interfaces**: Comprehensive TypeScript types in `types/fal-models.ts`
- **Convenience functions**: Specific functions for common use cases
- **Backward compatibility**: Existing code continues to work

## Available Models

### Text-to-Speech (TTS)
- **Model ID**: `elevenlabs-tts-turbo-v2.5`
- **Endpoint**: `fal-ai/elevenlabs/tts/turbo-v2.5`
- **Description**: High-quality text-to-speech synthesis

### Talking Head Generation
- **Model ID**: `omnihuman`
- **Endpoint**: `fal-ai/bytedance/omnihuman`
- **Description**: AI-powered talking head video generation

## Usage Examples

### Using the Generic Function

```typescript
import { generateWithFalModel } from '@/lib/fal-client';

// Generate TTS
const ttsResult = await generateWithFalModel({
  modelId: 'elevenlabs-tts-turbo-v2.5',
  input: {
    text: 'Hello, world!',
    voice: 'Aria',
    stability: 0.5,
    similarity_boost: 0.75,
    speed: 1
  },
  onProgress: (log) => console.log('TTS Progress:', log)
});

console.log('Audio URL:', ttsResult.output.audio.url);
```

### Using Convenience Functions

```typescript
import { generateTTS, generateTalkingHead } from '@/lib/fal-client';

// Generate TTS with convenience function
const ttsResult = await generateTTS('Hello, world!', {
  voice: 'Aria',
  stability: 0.5,
  onProgress: (log) => console.log('TTS Progress:', log)
});

// Generate talking head video
const avatarResult = await generateTalkingHead(
  'https://example.com/image.jpg',
  ttsResult.output.audio.url,
  (log) => console.log('Avatar Progress:', log)
);

console.log('Video URL:', avatarResult.output.video.url);
console.log('Duration:', avatarResult.duration);
```

## Adding New Models

To add a new fal.ai model:

### 1. Add Model Configuration

Add the model to `config/fal-models.ts`:

```typescript
'new-model-id': {
  id: 'new-model-id',
  name: 'New Model Name',
  endpoint: 'fal-ai/provider/model-name',
  description: 'Model description',
  category: 'tts' | 'avatar' | 'image' | 'video',
  inputSchema: {
    // Define input parameters
    text: { type: 'string', required: true },
    // ... other parameters
  },
  outputSchema: {
    // Define output structure
    audio: { type: 'object', properties: { url: 'string' } }
  }
}
```

### 2. Create Convenience Function (Optional)

Add a convenience function to `lib/fal-client.ts`:

```typescript
export async function generateWithNewModel(
  text: string,
  options: {
    // ... model-specific options
    onProgress?: (log: string) => void;
  } = {}
): Promise<FalGenerationResponse> {
  return generateWithFalModel({
    modelId: 'new-model-id',
    input: {
      text,
      // ... other parameters
    },
    onProgress: options.onProgress
  });
}
```

### 3. Use the Model

```typescript
// Using generic function
const result = await generateWithFalModel({
  modelId: 'new-model-id',
  input: { /* model inputs */ }
});

// Or using convenience function
const result = await generateWithNewModel('Hello world');
```

## Model Categories

- **tts**: Text-to-speech models
- **avatar**: Talking head/avatar generation models
- **image**: Image generation models
- **video**: Video generation models

## Error Handling

The client includes proper error handling:

```typescript
try {
  const result = await generateTTS('Hello world');
  console.log('Success:', result.output);
} catch (error) {
  console.error('Generation failed:', error.message);
}
```

## Progress Tracking

All generation functions support progress tracking:

```typescript
const result = await generateTTS('Hello world', {
  onProgress: (log) => {
    // Update UI with progress
    setProgress(log);
  }
});
```

## Backward Compatibility

Existing code using the legacy `generateWithFal()` function continues to work without changes. The new architecture is additive and doesn't break existing functionality. 