import { auth } from './firebase';
import { AvatarTemplate, AvatarTemplateQueryOptions } from '@/types/templates';

export interface AvatarSelectionFilters {
  gender?: 'male' | 'female' | 'neutral';
  category?: string;
  search?: string;
  isPublic?: boolean;
  userId?: string;
}

export interface AvatarSelectionOptions extends AvatarTemplateQueryOptions {
  filters?: AvatarSelectionFilters;
}

/**
 * Get public avatar templates with enhanced filtering
 */
export async function getPublicAvatarTemplates(options?: AvatarSelectionOptions): Promise<AvatarTemplate[]> {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  
  const params = new URLSearchParams();
  params.append('type', 'public');
  
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }
  
  if (options?.offset) {
    params.append('offset', options.offset.toString());
  }
  
  if (options?.orderBy) {
    params.append('orderBy', options.orderBy);
  }
  
  if (options?.orderDirection) {
    params.append('orderDirection', options.orderDirection);
  }
  
  if (options?.filters) {
    if (options.filters.gender) {
      params.append('gender', options.filters.gender);
    }
    if (options.filters.category) {
      params.append('category', options.filters.category);
    }
    if (options.filters.search) {
      params.append('search', options.filters.search);
    }
  }
  
  const url = `/api/templates/avatars?${params.toString()}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch avatar templates');
  }
  
  const result = await response.json();
  return result.data || [];
}

/**
 * Get user's own avatar templates
 */
export async function getUserAvatarTemplates(options?: AvatarSelectionOptions): Promise<AvatarTemplate[]> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User must be authenticated to fetch user templates');
  }

  const idToken = await user.getIdToken();
  
  const params = new URLSearchParams();
  params.append('type', 'user');
  
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }
  
  if (options?.offset) {
    params.append('offset', options.offset.toString());
  }
  
  if (options?.orderBy) {
    params.append('orderBy', options.orderBy);
  }
  
  if (options?.orderDirection) {
    params.append('orderDirection', options.orderDirection);
  }
  
  if (options?.filters) {
    if (options.filters.gender) {
      params.append('gender', options.filters.gender);
    }
    if (options.filters.category) {
      params.append('category', options.filters.category);
    }
    if (options.filters.search) {
      params.append('search', options.filters.search);
    }
  }
  
  const url = `/api/templates/avatars?${params.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user avatar templates');
  }
  
  const result = await response.json();
  return result.data || [];
}

/**
 * Get avatar templates by gender
 */
export async function getAvatarTemplatesByGender(
  gender: 'male' | 'female' | 'neutral',
  options?: AvatarSelectionOptions
): Promise<AvatarTemplate[]> {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  
  const params = new URLSearchParams();
  params.append('type', 'gender');
  params.append('gender', gender);
  
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }
  
  if (options?.offset) {
    params.append('offset', options.offset.toString());
  }
  
  if (options?.orderBy) {
    params.append('orderBy', options.orderBy);
  }
  
  if (options?.orderDirection) {
    params.append('orderDirection', options.orderDirection);
  }
  
  if (options?.filters) {
    if (options.filters.category) {
      params.append('category', options.filters.category);
    }
    if (options.filters.search) {
      params.append('search', options.filters.search);
    }
  }
  
  const url = `/api/templates/avatars?${params.toString()}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch avatar templates by gender');
  }
  
  const result = await response.json();
  return result.data || [];
}

/**
 * Get a specific avatar template by ID
 */
export async function getAvatarTemplateById(avatarId: string): Promise<AvatarTemplate> {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  
  const response = await fetch(`/api/templates/avatars/${avatarId}`, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch avatar template');
  }
  
  const result = await response.json();
  return result.data;
}

/**
 * Search avatar templates by name
 */
export async function searchAvatarTemplates(
  query: string, 
  options?: AvatarSelectionOptions
): Promise<AvatarTemplate[]> {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  
  const params = new URLSearchParams();
  params.append('search', query);
  params.append('type', 'public');
  
  if (options?.limit) {
    params.append('limit', options.limit.toString());
  }
  
  if (options?.filters) {
    if (options.filters.gender) {
      params.append('gender', options.filters.gender);
    }
    if (options.filters.category) {
      params.append('category', options.filters.category);
    }
  }
  
  const url = `/api/templates/avatars?${params.toString()}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  
  const response = await fetch(url, {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to search avatar templates');
  }
  
  const result = await response.json();
  return result.data || [];
}

/**
 * Get available avatar categories
 */
export async function getAvatarCategories(): Promise<string[]> {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  
  const response = await fetch('/api/templates/avatars/categories', {
    method: 'GET',
    headers,
  });
  
  if (!response.ok) {
    // If categories endpoint doesn't exist, return default categories
    return ['Car Talk', 'Podcast', 'Indoor', 'Outdoor', 'Professional', 'Casual'];
  }
  
  const result = await response.json();
  return result.data || [];
} 