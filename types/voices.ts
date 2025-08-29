export interface VoiceTemplate {
  id: string; // Firestore document ID
  voice_id: string; // ElevenLabs voice ID
  name: string;
  description: string;
  category: string;
  gender: 'male' | 'female' | 'neutral';
  age_group?: string;
  accent?: string;
  language: string;
  preview_url?: string;
  labels: Record<string, string>;
  settings: {
    stability: number;
    similarity_boost: number;
    style: number;
    speed: number;
  };
  is_public: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface VoiceCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  created_at: Date;
} 