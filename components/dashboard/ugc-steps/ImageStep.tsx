'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import Image from 'next/image';

import { useUGCStore } from '@/lib/ugc-store';

export function ImageStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [selectedAvatar, setSelectedAvatar] = useState<boolean>(
    !!videoConfig.character.avatarId
  );

  const handleAvatarSelect = () => {
    setSelectedAvatar(true);
    updateVideoConfig({
      character: {
        type: 'avatar',
        avatarId: 'example_avatar',
        imageUrl: undefined,
      },
    });
  };

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Choose Your Character</h3>
        <p className='text-sm text-default-500'>
          Select an avatar to use as the character in your video.
        </p>
      </div>

      {/* Avatar Selection */}
      <div>
        <h4 className='font-medium mb-3'>Select an Avatar</h4>
        <div className='flex justify-center'>
          <Card
            isPressable
            className={`cursor-pointer transition-all max-w-xs ${
              selectedAvatar
                ? 'ring-2 ring-primary border-primary'
                : 'hover:shadow-md'
            }`}
            onPress={handleAvatarSelect}
          >
            <CardBody className='p-4'>
              <div className='aspect-square mb-3 overflow-hidden rounded-lg'>
                <Image
                  alt='Example Avatar'
                  className='w-full h-full object-cover'
                  height={200}
                  src='/images/example_img.png'
                  width={200}
                />
              </div>
              <h5 className='text-sm font-medium text-center'>
                Example Avatar
              </h5>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Selection Summary */}
      {selectedAvatar && (
        <Card className='bg-primary/5 border border-primary/20'>
          <CardBody className='p-4'>
            <h4 className='font-medium mb-2'>Selected Character: Avatar</h4>
            <p className='text-sm text-default-600'>
              Using the example avatar for consistent results
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
