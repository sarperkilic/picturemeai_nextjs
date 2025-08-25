import { Timestamp } from 'firebase/firestore';

export interface AvatarTemplate {
  id: string;
  avatar_name: string;
  storage_url: string;
  category: string;
  gender: 'male' | 'female' | 'neutral';
  is_public: boolean;
  user_id: string | null; // null for system avatars
  file_name: string;
  file_size: number;
  created_at: Timestamp;
  updated_at: Timestamp;
  upload_source: 'user' | 'system'; // New field
}

export interface CreateAvatarTemplateData {
  avatar_name: string;
  storage_url: string;
  category: string;
  gender: 'male' | 'female' | 'neutral';
  is_public: boolean;
  user_id?: string;
  file_name: string;
  file_size: number;
  upload_source: 'user' | 'system';
}

export interface UpdateAvatarTemplateData {
  avatar_name?: string;
  category?: string;
  gender?: 'male' | 'female' | 'neutral';
  is_public?: boolean;
  updated_at?: Timestamp;
}

export interface AvatarTemplateFilters {
  gender?: 'male' | 'female' | 'neutral';
  category?: string;
  is_public?: boolean;
  user_id?: string;
}

export interface AvatarTemplateQueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'created_at' | 'avatar_name';
  orderDirection?: 'asc' | 'desc';
  filters?: AvatarTemplateFilters;
} 