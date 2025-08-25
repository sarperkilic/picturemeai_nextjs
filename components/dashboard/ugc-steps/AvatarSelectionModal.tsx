'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from '@heroui/modal';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Select, SelectItem } from '@heroui/select';
import { AvatarCard } from './AvatarCard';
import { getPublicAvatarTemplates, getUserAvatarTemplates, getAvatarCategories } from '@/lib/avatar-selection';
import { AvatarTemplate } from '@/types/templates';

interface AvatarSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (avatarId: string, imageUrl: string, avatarName: string) => void;
}

const GENDERS = [
  { label: 'All', value: 'all' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Neutral', value: 'neutral' },
];

export function AvatarSelectionModal({ isOpen, onClose, onSelect }: AvatarSelectionModalProps) {
  const [avatars, setAvatars] = useState<AvatarTemplate[]>([]);
  const [filteredAvatars, setFilteredAvatars] = useState<AvatarTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch avatars and categories when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchAvatars();
      fetchCategories();
    }
  }, [isOpen]);

  const fetchAvatars = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch both public avatars and user's own avatars
      const [publicAvatars, userAvatars] = await Promise.all([
        getPublicAvatarTemplates({
          limit: 50,
          filters: {
            gender: selectedGender !== 'all' ? selectedGender as 'male' | 'female' | 'neutral' : undefined,
            category: selectedCategory !== 'All' ? selectedCategory : undefined,
            search: searchQuery || undefined,
          }
        }),
        getUserAvatarTemplates({
          limit: 50,
          filters: {
            gender: selectedGender !== 'all' ? selectedGender as 'male' | 'female' | 'neutral' : undefined,
            category: selectedCategory !== 'All' ? selectedCategory : undefined,
            search: searchQuery || undefined,
          }
        })
      ]);
      
      // Combine and deduplicate avatars (in case user has public avatars)
      const allAvatars = [...publicAvatars, ...userAvatars];
      const uniqueAvatars = allAvatars.filter((avatar, index, self) => 
        index === self.findIndex(a => a.id === avatar.id)
      );
      
      setAvatars(uniqueAvatars);
      setFilteredAvatars(uniqueAvatars);
    } catch (err) {
      console.error('Failed to fetch avatars:', err);
      setError('Failed to load avatars. Please try again.');
      setAvatars([]);
      setFilteredAvatars([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getAvatarCategories();
      setCategories(['All', ...fetchedCategories]);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      // Fallback to default categories
      setCategories(['All', 'Car Talk', 'Podcast', 'Indoor', 'Outdoor', 'Business', 'Casual', 'Professional']);
    }
  };

  // Refetch avatars when filters change
  useEffect(() => {
    if (isOpen) {
      fetchAvatars();
    }
  }, [selectedCategory, selectedGender, searchQuery]);

  // Client-side filtering for better UX (in addition to server-side filtering)
  useEffect(() => {
    let filtered = avatars;

    // Additional client-side filtering by search query
    if (searchQuery) {
      filtered = filtered.filter(avatar =>
        avatar.avatar_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        avatar.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredAvatars(filtered);
  }, [avatars, searchQuery]);

  const handleAvatarSelect = (avatar: AvatarTemplate) => {
    onSelect(avatar.id, avatar.storage_url, avatar.avatar_name);
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedGender('all');
    setError('');
    setAvatars([]);
    setFilteredAvatars([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalContent>
        <ModalHeader>Select Avatar</ModalHeader>
        <ModalBody>
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="space-y-4">
              <Input
                placeholder="Search avatars..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={
                  <svg className="w-4 h-4 text-default-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  selectedKeys={selectedCategory ? [selectedCategory] : []}
                  onSelectionChange={(keys) => setSelectedCategory(Array.from(keys)[0] as string)}
                  isDisabled={categories.length === 0}
                >
                  {categories.map((category) => (
                    <SelectItem key={category}>
                      {category}
                    </SelectItem>
                  ))}
                </Select>

                <Select
                  label="Gender"
                  selectedKeys={selectedGender ? [selectedGender] : []}
                  onSelectionChange={(keys) => setSelectedGender(Array.from(keys)[0] as string)}
                >
                  {GENDERS.map((gender) => (
                    <SelectItem key={gender.value}>
                      {gender.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
            </div>

            {/* Avatar Grid */}
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-default-500">Loading avatars...</span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-danger mb-4">{error}</p>
                <Button 
                  color="primary" 
                  variant="flat" 
                  onPress={fetchAvatars}
                  size="sm"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredAvatars.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-default-500 mb-4">No avatars found matching your criteria.</p>
                <Button 
                  color="primary" 
                  variant="flat" 
                  onPress={() => {
                    setSelectedCategory('All');
                    setSelectedGender('all');
                    setSearchQuery('');
                  }}
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredAvatars.map((avatar) => (
                  <AvatarCard
                    key={avatar.id}
                    avatar={avatar}
                    onSelect={() => handleAvatarSelect(avatar)}
                  />
                ))}
              </div>
            )}

            {/* Results count */}
            {!isLoading && !error && filteredAvatars.length > 0 && (
              <div className="text-center text-sm text-default-500">
                Showing {filteredAvatars.length} avatar{filteredAvatars.length !== 1 ? 's' : ''}
                {avatars.some(avatar => avatar.user_id !== null) && (
                  <span className="ml-2 text-primary">(including your uploaded avatars)</span>
                )}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={handleClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 