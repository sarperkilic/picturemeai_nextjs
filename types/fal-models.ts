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