# ElevenLabs Voice Library Integration

## Goal
Enable users to browse, search, preview, and select a speech voice from a curated collection of ElevenLabs voices stored in Firestore. The selection is used when starting a video generation job (voice section in Create UGC Video popup).

## Feature Description
Create a Firestore-based voice library system that stores ElevenLabs voice metadata locally. Users can search through available voices, filter by categories, preview audio samples, and select their preferred voice for the video generation process. This approach provides better performance, offline capability, and consistent architecture with the existing avatar template system.

## Technical Requirements

### Current State Analysis
The existing system has:
- UGC video generation modal with 3 steps (Character, Script, Voice)
- AudioSettingsStep component with hardcoded voice options
- Video generation pipeline that accepts voiceId parameter
- SWR-based data fetching patterns established
- Firestore-based avatar template system (`/templates/avatars/avatars/`)
- Existing voice selection in VideoConfig interface

### Firestore Voice Library Architecture
**Goal**: Create Firestore-based voice library system with admin tools to populate voice metadata

**Database Schema:**
```
templates/voices/{voiceId}
├── voice_id: string (ElevenLabs voice ID)
├── name: string
├── description: string
├── category: string
├── gender: "male" | "female" | "neutral"
├── age_group?: string
├── accent?: string
├── language: string
├── preview_url?: string
├── labels: Record<string, string>
├── settings: {
│   stability: number
│   similarity_boost: number
│   style: number
│   speed: number
│ }
├── is_public: boolean
├── user_id?: string (reserved for future use)
├── created_at: Timestamp
└── updated_at: Timestamp
```

**Files to Create/Modify:**

#### 1. Create `types/voices.ts`
```typescript
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
```

#### 2. Create `lib/voices.ts`
```typescript
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { VoiceTemplate, VoiceCategory } from '@/types/voices';

const VOICES_COLLECTION = 'templates/voices/voices';
const CATEGORIES_COLLECTION = 'templates/voices/categories';

export async function getVoiceTemplates(options: {
  category?: string;
  gender?: string;
  language?: string;
  limit?: number;
  startAfterDoc?: any;
} = {}): Promise<VoiceTemplate[]> {
  try {
    const { category, gender, language, limit: limitCount = 50, startAfterDoc } = options;
    
    let q = query(
      collection(db, VOICES_COLLECTION),
      orderBy('name'),
      limit(limitCount)
    );

    if (category) {
      q = query(q, where('category', '==', category));
    }

    if (gender) {
      q = query(q, where('gender', '==', gender));
    }

    if (language) {
      q = query(q, where('language', '==', language));
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    const voices: VoiceTemplate[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      voices.push({
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
      } as VoiceTemplate);
    });

    return voices;
  } catch (error) {
    console.error('Error fetching voice templates:', error);
    throw error;
  }
}

export async function getVoiceTemplateById(voiceId: string): Promise<VoiceTemplate | null> {
  try {
    const docRef = doc(db, VOICES_COLLECTION, voiceId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        created_at: data.created_at?.toDate(),
        updated_at: data.updated_at?.toDate(),
      } as VoiceTemplate;
    }

    return null;
  } catch (error) {
    console.error('Error fetching voice template:', error);
    throw error;
  }
}

export async function getVoiceCategories(): Promise<VoiceCategory[]> {
  try {
    const querySnapshot = await getDocs(collection(db, CATEGORIES_COLLECTION));
    const categories: VoiceCategory[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate(),
      } as VoiceCategory);
    });

    return categories;
  } catch (error) {
    console.error('Error fetching voice categories:', error);
    throw error;
  }
}

export async function searchVoiceTemplates(searchTerm: string, options: {
  category?: string;
  gender?: string;
  language?: string;
} = {}): Promise<VoiceTemplate[]> {
  try {
    // Get all voices and filter client-side for better search experience
    const voices = await getVoiceTemplates({ ...options, limit: 1000 });
    
    if (!searchTerm) return voices;

    const searchLower = searchTerm.toLowerCase();
    return voices.filter(voice =>
      voice.name.toLowerCase().includes(searchLower) ||
      voice.description.toLowerCase().includes(searchLower) ||
      Object.values(voice.labels).some(label => 
        label.toLowerCase().includes(searchLower)
      )
    );
  } catch (error) {
    console.error('Error searching voice templates:', error);
    throw error;
  }
}
```

#### 3. Create `scripts/populate-voices.ts` (Admin Script)
```typescript
import { adminDb } from '@/lib/firebase-admin';
import { VoiceTemplate } from '@/types/voices';

async function populateVoicesFromElevenLabs() {
  try {
    // Fetch voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v2/voices?page_size=1000', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    const voices = data.voices || [];

    console.log(`Found ${voices.length} voices from ElevenLabs`);

    // Process and store each voice
    for (const voice of voices) {
      const voiceTemplate: Omit<VoiceTemplate, 'id'> = {
        voice_id: voice.voice_id,
        name: voice.name,
        description: voice.description || '',
        category: voice.labels.category || 'general',
        gender: voice.labels.gender || 'neutral',
        age_group: voice.labels.age,
        accent: voice.labels.accent,
        language: voice.verified_languages?.[0]?.language || 'en',
        preview_url: voice.preview_url,
        labels: voice.labels,
        settings: voice.settings,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Check if voice already exists
      const existingVoice = await adminDb
        .collection('templates/voices/voices')
        .where('voice_id', '==', voice.voice_id)
        .get();

      if (existingVoice.empty) {
        // Create new voice document
        await adminDb.collection('templates/voices/voices').add(voiceTemplate);
        console.log(`Created voice: ${voice.name}`);
      } else {
        // Update existing voice
        const docId = existingVoice.docs[0].id;
        await adminDb.collection('templates/voices/voices').doc(docId).update({
          ...voiceTemplate,
          updated_at: new Date(),
        });
        console.log(`Updated voice: ${voice.name}`);
      }
    }

    console.log('Voice population completed successfully');
  } catch (error) {
    console.error('Error populating voices:', error);
  }
}

// Run the script
populateVoicesFromElevenLabs();
```

#### 4. Create `app/api/templates/voices/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getVoiceTemplates, getVoiceCategories } from '@/lib/voices';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const gender = searchParams.get('gender');
    const language = searchParams.get('language');
    const limit = parseInt(searchParams.get('limit') || '50');

    const voices = await getVoiceTemplates({
      category: category || undefined,
      gender: gender || undefined,
      language: language || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      voices,
    });
  } catch (error) {
    console.error('Error fetching voice templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice templates' },
      { status: 500 }
    );
  }
}
```

#### 5. Create `app/api/templates/voices/categories/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getVoiceCategories } from '@/lib/voices';

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const categories = await getVoiceCategories();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('Error fetching voice categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice categories' },
      { status: 500 }
    );
  }
}
```

#### 6. Create `app/api/templates/voices/[voiceId]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getVoiceTemplateById } from '@/lib/voices';

export async function GET(
  request: NextRequest,
  { params }: { params: { voiceId: string } }
) {
  try {
    const session = await auth.api.getSession({ headers: headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const voice = await getVoiceTemplateById(params.voiceId);

    if (!voice) {
      return NextResponse.json({ error: 'Voice not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      voice,
    });
  } catch (error) {
    console.error('Error fetching voice template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch voice template' },
      { status: 500 }
    );
  }
}
```
```typescript
import { adminDb } from '@/lib/firebase-admin';
import { VoiceTemplate } from '@/types/voices';

async function populateVoicesFromElevenLabs() {
  try {
    // Fetch voices from ElevenLabs API
    const response = await fetch('https://api.elevenlabs.io/v2/voices?page_size=1000', {
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const data = await response.json();
    const voices = data.voices || [];

    console.log(`Found ${voices.length} voices from ElevenLabs`);

    // Process and store each voice
    for (const voice of voices) {
      const voiceTemplate: Omit<VoiceTemplate, 'id'> = {
        voice_id: voice.voice_id,
        name: voice.name,
        description: voice.description || '',
        category: voice.labels.category || 'general',
        gender: voice.labels.gender || 'neutral',
        age_group: voice.labels.age,
        accent: voice.labels.accent,
        language: voice.verified_languages?.[0]?.language || 'en',
        preview_url: voice.preview_url,
        labels: voice.labels,
        settings: voice.settings,
        is_public: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Check if voice already exists
      const existingVoice = await adminDb
        .collection('templates/voices/voices')
        .where('voice_id', '==', voice.voice_id)
        .get();

      if (existingVoice.empty) {
        // Create new voice document
        await adminDb.collection('templates/voices/voices').add(voiceTemplate);
        console.log(`Created voice: ${voice.name}`);
      } else {
        // Update existing voice
        const docId = existingVoice.docs[0].id;
        await adminDb.collection('templates/voices/voices').doc(docId).update({
          ...voiceTemplate,
          updated_at: new Date(),
        });
        console.log(`Updated voice: ${voice.name}`);
      }
    }

    console.log('Voice population completed successfully');
  } catch (error) {
    console.error('Error populating voices:', error);
  }
}

// Run the script
populateVoicesFromElevenLabs();
```

### Client-Side Data Fetching
**Goal**: Create SWR hook for voice fetching from Firestore with client-side filtering

#### 2. Create `lib/hooks/use-voices.ts`
```typescript
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
```

### Voice Library Modal Component
**Goal**: Create comprehensive voice selection modal with search, filters, and preview functionality

#### 3. Create `components/dashboard/ugc-steps/VoiceLibraryModal.tsx`
```typescript
'use client';

import { useState, useCallback, useRef } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Chip } from '@heroui/chip';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useVoices, ElevenLabsVoice } from '@/lib/hooks/use-voices';
import { PlayIcon, PauseIcon } from '@/components/icons';

interface VoiceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (voice: VoiceTemplate) => void;
}

const VOICE_CATEGORIES = [
  { label: 'All', value: '' },
  { label: 'Emotions', value: 'emotions' },
  { label: 'Stream', value: 'stream' },
  { label: 'Car Talk', value: 'car_talk' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'Vlog', value: 'vlog' },
  { label: 'Forum', value: 'forum' },
  { label: 'Coaching', value: 'coaching' },
];

const GENDER_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
];

export function VoiceLibraryModal({ isOpen, onClose, onSelect }: VoiceLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch voices with client-side filtering
  const { voices, categories, totalCount, totalPages, isLoading, error } = useVoices({
    search: debouncedSearch,
    category: selectedCategory,
    gender: selectedGender,
    pageSize: 20,
    currentPage,
  });

  // Handle voice preview
  const handlePreview = useCallback((voice: VoiceTemplate) => {
    if (!voice.preview_url) return;

    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    // Play new audio
    const audio = new Audio(voice.preview_url);
    audioRef.current = audio;
    setPlayingVoiceId(voice.id);

    audio.addEventListener('ended', () => {
      setPlayingVoiceId(null);
      audioRef.current = null;
    });

    audio.play().catch(console.error);
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    // Stop any playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingVoiceId(null);
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedGender('');
    setCurrentPage(1);
    onClose();
  }, [onClose]);

  // Handle voice selection
  const handleSelect = useCallback((voice: VoiceTemplate) => {
    handleClose();
    onSelect(voice);
  }, [handleClose, onSelect]);

  // Filter voices by gender (client-side)
  const filteredVoices = selectedGender
    ? voices.filter(voice => voice.labels.gender === selectedGender)
    : voices;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalContent>
        <ModalHeader>Select Voice</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <Input
                placeholder="Search voices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={
                  <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />

              <div className="flex flex-wrap gap-2">
                <Chip
                  variant={selectedCategory === '' ? 'solid' : 'bordered'}
                  color={selectedCategory === '' ? 'primary' : 'default'}
                  onPress={() => setSelectedCategory('')}
                >
                  All
                </Chip>
                {categories.map((category) => (
                  <Chip
                    key={category.id}
                    variant={selectedCategory === category.name ? 'solid' : 'bordered'}
                    color={selectedCategory === category.name ? 'primary' : 'default'}
                    onPress={() => setSelectedCategory(category.name)}
                  >
                    {category.name}
                  </Chip>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {GENDER_FILTERS.map((gender) => (
                  <Chip
                    key={gender.value}
                    variant={selectedGender === gender.value ? 'solid' : 'bordered'}
                    color={selectedGender === gender.value ? 'primary' : 'default'}
                    onPress={() => setSelectedGender(gender.value)}
                  >
                    {gender.label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Voice Grid */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardBody className="p-4">
                      <div className="h-4 bg-default-200 rounded mb-2"></div>
                      <div className="h-3 bg-default-200 rounded mb-2"></div>
                      <div className="h-3 bg-default-200 rounded w-2/3"></div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-danger">Error loading voices: {error.message}</p>
                <Button color="primary" variant="flat" onPress={() => window.location.reload()}>
                  Retry
                </Button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {voices.map((voice) => (
                    <Card key={voice.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardBody className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{voice.name}</h4>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {voice.age_group && (
                                <span className="px-2 py-1 bg-default-100 text-xs rounded-full">
                                  {voice.age_group}
                                </span>
                              )}
                              {voice.gender && (
                                <span className="px-2 py-1 bg-default-100 text-xs rounded-full">
                                  {voice.gender}
                                </span>
                              )}
                            </div>
                            {voice.description && (
                              <p className="text-xs text-default-500 line-clamp-2">
                                {voice.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2">
                          {voice.preview_url && (
                            <Button
                              size="sm"
                              variant="flat"
                              color="primary"
                              onPress={() => handlePreview(voice)}
                              startContent={
                                playingVoiceId === voice.id ? (
                                  <PauseIcon className="w-4 h-4" />
                                ) : (
                                  <PlayIcon className="w-4 h-4" />
                                )
                              }
                            >
                              {playingVoiceId === voice.id ? 'Stop' : 'Preview'}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            color="primary"
                            onPress={() => handleSelect(voice)}
                          >
                            Select
                          </Button>
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6 gap-2">
                    <Button
                      color="primary"
                      variant="flat"
                      isDisabled={currentPage === 1}
                      onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-4 text-sm text-default-500">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      color="primary"
                      variant="flat"
                      isDisabled={currentPage === totalPages}
                      onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
```

### Enhanced Audio Settings Step
**Goal**: Update existing AudioSettingsStep to integrate with ElevenLabs Voice Library

#### 4. Update `components/dashboard/ugc-steps/AudioSettingsStep.tsx`
```typescript
'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { useUGCStore } from '@/lib/ugc-store';
import { VoiceLibraryModal } from './VoiceLibraryModal';
import { VoiceTemplate } from '@/types/voices';

export function AudioSettingsStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<VoiceTemplate | null>(null);

  const handleVoiceSelect = (voice: VoiceTemplate) => {
    setSelectedVoice(voice);
    updateVideoConfig({
      audio: {
        text: videoConfig.audio.text,
        voice: voice.voice_id, // Use ElevenLabs voice_id for generation
      },
    });
  };

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Choose Voice</h3>
        <p className='text-sm text-default-500'>
          Select the voice that will speak your script.
        </p>
      </div>

      {/* Voice Selection */}
      <div>
        <h4 className='font-medium mb-3'>Voice Selection</h4>
        
        {selectedVoice ? (
          <Card className="mb-4">
            <CardBody className='p-4'>
              <div className='flex items-start gap-3'>
                <div className='w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center'>
                  <span className='text-lg font-semibold text-primary'>
                    {selectedVoice.name.charAt(0)}
                  </span>
                </div>
                <div className='flex-1'>
                  <h5 className='font-medium text-sm mb-1'>{selectedVoice.name}</h5>
                  <div className='flex flex-wrap gap-1 mb-1'>
                    {selectedVoice.age_group && (
                      <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                        {selectedVoice.age_group}
                      </span>
                    )}
                    {selectedVoice.gender && (
                      <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                        {selectedVoice.gender}
                      </span>
                    )}
                  </div>
                  {selectedVoice.description && (
                    <p className='text-xs text-default-500'>
                      {selectedVoice.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  onPress={() => {
                    setSelectedVoice(null);
                    updateVideoConfig({
                      audio: {
                        text: videoConfig.audio.text,
                        voice: '',
                      },
                    });
                  }}
                >
                  Change
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-default-200 rounded-lg">
            <p className="text-default-500 mb-4">No voice selected</p>
            <Button
              color="primary"
              onPress={() => setIsVoiceModalOpen(true)}
            >
              Browse Voices
            </Button>
          </div>
        )}

        <Button
          color="primary"
          variant="flat"
          onPress={() => setIsVoiceModalOpen(true)}
        >
          {selectedVoice ? 'Change Voice' : 'Select Voice'}
        </Button>
      </div>

      {/* Voice Library Modal */}
      <VoiceLibraryModal
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onSelect={handleVoiceSelect}
      />
    </div>
  );
}
```

### Utility Hook for Debouncing
**Goal**: Create reusable debounce hook for search functionality

#### 5. Create `lib/hooks/use-debounce.ts`
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

### Type Definitions
**Goal**: Add ElevenLabs voice types to existing type system

#### 6. Update `types/ugc.ts`
```typescript
// ... existing code ...

export interface VideoConfig {
  character: {
    type: 'avatar' | 'upload';
    imageUrl?: string;
    avatarId?: string;
  };
  audio: {
    text: string;
    voice: string; // This will now store ElevenLabs voice_id
  };
}

// ... rest of existing code ...
```

#### 7. Create `types/voices.ts`
```typescript
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
```

## Implementation Phases

### Phase 1: Firestore Infrastructure
1. Create voice template types and database schema
2. Create admin script to populate voices from ElevenLabs API
3. Set up Firestore security rules for voice templates

### Phase 2: Data Layer
1. Create voice fetching functions (`lib/voices.ts`)
2. Create SWR hook for voice fetching
3. Add TypeScript type definitions

### Phase 3: UI Components
1. Create VoiceLibraryModal component
2. Update AudioSettingsStep component
3. Add voice preview functionality

### Phase 4: Integration and Testing
1. Integrate with existing video generation flow
2. Test voice selection and preview
3. Validate Firestore queries and caching

## Environment Variables Required
```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

## Security Considerations

**Firestore Rules:**
- System voices: Read-only for all authenticated users, write access for admins only
- All voices are public and managed by admin

**Voice Template Access:**
- Voice metadata: Read access for all authenticated users
- Preview URLs: Public access for audio previews
- Settings: Read access for voice generation parameters

## Error Handling

**Population Failures:**
- Retry logic for network failures
- Duplicate voice_id handling
- Partial population recovery
- Error logging and monitoring

**Database Failures:**
- Transaction rollback if voice creation fails
- Cleanup of orphaned voice records
- Error logging and monitoring

## Performance Considerations

**Population Optimization:**
- Batch operations for multiple voices
- Progress tracking for large voice libraries
- Incremental updates for existing voices
- Error recovery for failed operations

**Database Optimization:**
- Index on `category` for filtering
- Index on `voice_id` for unique lookups
- Index on `gender` and `language` for filtering
- Pagination for large voice collections

## Benefits

### User Experience
- **Rich Voice Selection**: Access to hundreds of high-quality AI voices
- **Advanced Filtering**: Filter by category, gender, and search terms
- **Audio Preview**: Listen to voice samples before selection
- **Responsive Design**: Works on desktop and mobile devices
- **Instant Search**: Client-side filtering provides immediate results
- **Offline Capability**: Works without external API connectivity

### Developer Experience
- **Type Safety**: Full TypeScript support for voice templates
- **Reusable Components**: Modular design for easy maintenance
- **Error Handling**: Comprehensive error handling and user feedback
- **Performance**: Direct Firestore queries with efficient caching
- **Consistent Architecture**: Same pattern as avatar templates
- **Custom Categorization**: Organize voices however we want

### Security
- **Firestore Security**: Leverage existing Firestore security rules
- **Authentication**: User authentication required for all requests
- **No External Dependencies**: Reduced attack surface
- **Data Control**: Full control over voice metadata and organization

## File Structure
```
app/
├── api/
│   └── templates/
│       └── voices/
│           ├── route.ts                    # Voice templates API
│           ├── categories/
│           │   └── route.ts                # Voice categories API
│           └── [voiceId]/
│               └── route.ts                # Individual voice API

components/dashboard/ugc-steps/
├── AudioSettingsStep.tsx                   # Updated with voice library
└── VoiceLibraryModal.tsx                   # New voice selection modal

lib/
├── hooks/
│   ├── use-voices.ts                       # SWR hook for voice fetching
│   └── use-debounce.ts                     # Debounce utility hook
├── voices.ts                               # Voice template functions

scripts/
└── populate-voices.ts                      # Admin script to populate voices

types/
└── voices.ts                               # Voice template type definitions

Firestore Collections:
├── templates/
│   └── voices/
│       ├── voices/                         # Voice templates
│       └── categories/                     # Voice categories
```

## Goal of This Plan

This plan establishes the foundation for voice template management in the UGC video generation system. It enables users to select from pre-populated ElevenLabs voice templates managed by administrators. The voice templates collection will serve as the data source for voice selection in the video generation workflow, following the same architectural patterns as the existing avatar template system. 