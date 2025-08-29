import useSWR from 'swr';
import { useSession } from '@/lib/use-firebase-auth';
import { useMemo } from 'react';
import { getVoiceTemplates, getVoiceCategories, searchVoiceTemplates } from '@/lib/voices';
import { VoiceTemplate, VoiceCategory } from '@/types/voices';

interface UseVoicesOptions {
  search?: string;
  category?: string;
  gender?: string;
  language?: string;
  pageSize?: number;
  currentPage?: number;
}

export function useVoices(options: UseVoicesOptions = {}) {
  const { user } = useSession();
  const {
    search = '',
    category = '',
    gender = '',
    language = '',
    pageSize = 20,
    currentPage = 1,
  } = options;

  // Fetch voices from Firestore
  const { data: voices, error: voicesError, isLoading: voicesLoading, mutate: refreshVoices } = useSWR<VoiceTemplate[]>(
    user?.id ? ['voices', category, gender, language] : null,
    async () => {
      if (search) {
        return searchVoiceTemplates(search, { category, gender, language });
      }
      return getVoiceTemplates({ category, gender, language, limit: 1000 });
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5 * 60 * 1000, // Cache for 5 minutes
      errorRetryCount: 3,
      errorRetryInterval: 2000,
    }
  );

  // Fetch categories
  const { data: categories, error: categoriesError, isLoading: categoriesLoading } = useSWR<VoiceCategory[]>(
    user?.id ? 'voice-categories' : null,
    async () => getVoiceCategories(),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 10 * 60 * 1000, // Cache for 10 minutes
    }
  );

  // Client-side pagination
  const paginatedVoices = useMemo(() => {
    if (!voices) return [];
    
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return voices.slice(startIndex, endIndex);
  }, [voices, currentPage, pageSize]);

  const totalPages = Math.ceil((voices?.length || 0) / pageSize);
  const hasMore = currentPage < totalPages;

  return {
    voices: paginatedVoices,
    allVoices: voices || [],
    categories: categories || [],
    totalCount: voices?.length || 0,
    totalPages,
    currentPage,
    hasMore,
    isLoading: voicesLoading || categoriesLoading,
    error: voicesError || categoriesError,
    mutate: refreshVoices,
  };
} 