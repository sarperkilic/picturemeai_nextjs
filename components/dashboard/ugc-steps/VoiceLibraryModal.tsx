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
import { useVoices } from '@/lib/hooks/use-voices';
import { useVoiceFavorites } from '@/lib/hooks/use-voice-favorites';
import { useVoiceRecommendations } from '@/lib/hooks/use-voice-recommendations';
import { VoiceTemplate } from '@/types/voices';
import { PlayIcon, PauseIcon, HeartFilledIcon } from '@/components/icons';

interface VoiceLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (voice: VoiceTemplate) => void;
}

const GENDER_FILTERS = [
  { label: 'All', value: '' },
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: 'Neutral', value: 'neutral' },
];

export function VoiceLibraryModal({ isOpen, onClose, onSelect }: VoiceLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recommendations'>('all');
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

  // Voice favorites and recommendations
  const { favorites, addToFavorites, removeFromFavorites, isFavorite } = useVoiceFavorites();
  const { recommendations, trendingVoices, recentlyUsedVoices } = useVoiceRecommendations();

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

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(async (voice: VoiceTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isFavorite(voice.voice_id)) {
      await removeFromFavorites(voice.voice_id);
    } else {
      await addToFavorites(voice);
    }
  }, [isFavorite, removeFromFavorites, addToFavorites]);

  // Get voices to display based on active tab
  const getDisplayVoices = () => {
    switch (activeTab) {
      case 'favorites':
        return voices.filter(voice => isFavorite(voice.voice_id));
      case 'recommendations':
        return recommendations.map(rec => rec.voice);
      default:
        return voices;
    }
  };

  const displayVoices = getDisplayVoices();

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalContent>
        <ModalHeader>
          <h2 className="text-xl font-semibold">Select Voice</h2>
          <p className="text-sm text-default-500 mt-1">
            Choose from {totalCount} available voices
          </p>
          
          {/* Tab Navigation */}
          <div className="flex gap-1 mt-4">
            <button
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-default-100 hover:bg-default-200'
              }`}
              onClick={() => setActiveTab('all')}
            >
              All Voices
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'favorites'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-default-100 hover:bg-default-200'
              }`}
              onClick={() => setActiveTab('favorites')}
            >
              Favorites ({favorites.length})
            </button>
            <button
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'recommendations'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-default-100 hover:bg-default-200'
              }`}
              onClick={() => setActiveTab('recommendations')}
            >
              Recommendations ({recommendations.length})
            </button>
          </div>
        </ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <Input
                placeholder="Search voices by name, description, or labels..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={
                  <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                size="lg"
              />

              {/* Category Filters */}
              <div>
                <h4 className="text-sm font-medium mb-2">Categories</h4>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    variant={selectedCategory === '' ? 'solid' : 'bordered'}
                    color={selectedCategory === '' ? 'primary' : 'default'}
                    onClick={() => setSelectedCategory('')}
                    size="sm"
                  >
                    All Categories
                  </Chip>
                  {categories.map((category) => (
                    <Chip
                      key={category.id}
                      variant={selectedCategory === category.name ? 'solid' : 'bordered'}
                      color={selectedCategory === category.name ? 'primary' : 'default'}
                      onClick={() => setSelectedCategory(category.name)}
                      size="sm"
                    >
                      {category.icon} {category.name}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* Gender Filters */}
              <div>
                <h4 className="text-sm font-medium mb-2">Gender</h4>
                <div className="flex flex-wrap gap-2">
                  {GENDER_FILTERS.map((gender) => (
                    <Chip
                      key={gender.value}
                      variant={selectedGender === gender.value ? 'solid' : 'bordered'}
                      color={selectedGender === gender.value ? 'primary' : 'default'}
                      onClick={() => setSelectedGender(gender.value)}
                      size="sm"
                    >
                      {gender.label}
                    </Chip>
                  ))}
                </div>
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
            ) : displayVoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-default-500">
                  {activeTab === 'favorites' 
                    ? 'No favorite voices yet. Add some voices to your favorites!'
                    : activeTab === 'recommendations'
                    ? 'No recommendations available yet. Try using some voices first!'
                    : 'No voices found matching your criteria.'
                  }
                </p>
                {activeTab === 'all' && (
                  <Button 
                    color="primary" 
                    variant="flat" 
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedCategory('');
                      setSelectedGender('');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {displayVoices.map((voice) => (
                    <Card key={voice.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardBody className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium text-sm">{voice.name}</h4>
                              <button
                                onClick={(e) => handleFavoriteToggle(voice, e)}
                                className={`p-1 rounded-full transition-colors ${
                                  isFavorite(voice.voice_id)
                                    ? 'text-red-500 hover:text-red-600'
                                    : 'text-default-400 hover:text-red-500'
                                }`}
                              >
                                <HeartFilledIcon className="w-4 h-4" />
                              </button>
                            </div>
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
                              {voice.accent && (
                                <span className="px-2 py-1 bg-default-100 text-xs rounded-full">
                                  {voice.accent}
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

                {/* Pagination - Only show for 'all' tab */}
                {activeTab === 'all' && totalPages > 1 && (
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
        <ModalFooter>
          <Button color="danger" variant="flat" onPress={handleClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 