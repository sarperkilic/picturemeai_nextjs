'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import Image from 'next/image';
import { UploadIcon, UserIcon } from '@/components/icons';

import { useUGCStore } from '@/lib/ugc-store';
import { AvatarUploadModal } from './AvatarUploadModal';
import { AvatarSelectionModal } from './AvatarSelectionModal';

export function ImageStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  const handleUploadSuccess = (imageUrl: string, avatarName: string) => {
    console.log('Avatar uploaded:', { imageUrl, avatarName });
    updateVideoConfig({
      character: {
        type: 'upload',
        imageUrl,
      },
    });
    setIsUploadModalOpen(false);
  };

  const handleAvatarSelect = (avatarId: string, imageUrl: string, avatarName: string) => {
    console.log('Avatar selected:', { avatarId, imageUrl, avatarName });
    updateVideoConfig({
      character: {
        type: 'avatar',
        avatarId,
        imageUrl,
      },
    });
    setIsSelectionModalOpen(false);
  };

  const getSelectedCharacterInfo = () => {
    if (videoConfig.character.type === 'upload' && videoConfig.character.imageUrl) {
      return {
        type: 'upload',
        imageUrl: videoConfig.character.imageUrl,
        name: 'Custom Upload',
      };
    } else if (videoConfig.character.type === 'avatar' && videoConfig.character.imageUrl) {
      return {
        type: 'avatar',
        imageUrl: videoConfig.character.imageUrl,
        name: 'Selected Avatar',
      };
    }
    return null;
  };

  const selectedCharacter = getSelectedCharacterInfo();

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Choose Your Character</h3>
        <p className='text-sm text-default-500'>
          Upload a custom image or select from our avatar templates.
        </p>
      </div>

      {/* Character Selection Options */}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {/* Upload Option */}
        <Card
          isPressable
          className='cursor-pointer transition-all hover:shadow-md border-2 border-dashed border-default-300 hover:border-primary'
          onPress={() => setIsUploadModalOpen(true)}
        >
          <CardBody className='p-6 text-center'>
            <div className='flex flex-col items-center space-y-3'>
              <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center'>
                <UploadIcon className='w-8 h-8 text-primary' />
              </div>
              <div>
                <h4 className='font-medium text-lg'>Upload an Image</h4>
                <p className='text-sm text-default-500 mt-1'>
                  Use your own photo or image
                </p>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Select Avatar Option */}
        <Card
          isPressable
          className='cursor-pointer transition-all hover:shadow-md border-2 border-dashed border-default-300 hover:border-primary'
          onPress={() => setIsSelectionModalOpen(true)}
        >
          <CardBody className='p-6 text-center'>
            <div className='flex flex-col items-center space-y-3'>
              <div className='w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center'>
                <UserIcon className='w-8 h-8 text-primary' />
              </div>
              <div>
                <h4 className='font-medium text-lg'>Select Avatar</h4>
                <p className='text-sm text-default-500 mt-1'>
                  Choose from our template library
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Selection Summary */}
      {selectedCharacter && (
        <Card className='bg-primary/5 border border-primary/20'>
          <CardBody className='p-4'>
            <div className='flex items-center space-x-4'>
              <div className='w-16 h-16 rounded-lg overflow-hidden flex-shrink-0'>
                <Image
                  alt={selectedCharacter.name}
                  className='w-full h-full object-cover'
                  height={64}
                  src={selectedCharacter.imageUrl}
                  width={64}
                />
              </div>
              <div className='flex-1'>
                <h4 className='font-medium mb-1'>
                  Selected Character: {selectedCharacter.name}
                </h4>
                <p className='text-sm text-default-600'>
                  {selectedCharacter.type === 'upload' 
                    ? 'Using your custom uploaded image'
                    : 'Using a template avatar for consistent results'
                  }
                </p>
              </div>
              <Button
                size='sm'
                variant='light'
                onPress={() => {
                  updateVideoConfig({
                    character: {
                      type: 'avatar',
                    },
                  });
                }}
              >
                Change
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Modals */}
      <AvatarUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      <AvatarSelectionModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSelect={handleAvatarSelect}
      />
    </div>
  );
}
