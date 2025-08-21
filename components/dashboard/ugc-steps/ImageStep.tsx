'use client';

import { useState, useRef } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import Image from 'next/image';

import { useUGCStore } from '@/lib/ugc-store';

// Mock avatar data
const AVATARS = [
  { id: '1', name: 'Professional Male', image: '/images/sample1.png' },
  { id: '2', name: 'Professional Female', image: '/images/sample2.png' },
  { id: '3', name: 'Casual Male', image: '/images/sample3.png' },
  { id: '4', name: 'Casual Female', image: '/images/sample4.png' },
  { id: '5', name: 'Young Professional', image: '/images/sample5.png' },
  { id: '6', name: 'Creative Artist', image: '/images/sample6.png' },
];

export function ImageStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [characterType, setCharacterType] = useState<'avatar' | 'upload'>(
    videoConfig.character.type
  );
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(
    videoConfig.character.avatarId || null
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(
    videoConfig.character.imageUrl || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCharacterTypeChange = (type: 'avatar' | 'upload') => {
    setCharacterType(type);
    updateVideoConfig({
      character: {
        type,
        avatarId: type === 'avatar' ? selectedAvatar || undefined : undefined,
        imageUrl: type === 'upload' ? uploadedImage || undefined : undefined,
      },
    });
  };

  const handleAvatarSelect = (avatarId: string) => {
    setSelectedAvatar(avatarId);
    updateVideoConfig({
      character: {
        type: 'avatar',
        avatarId,
        imageUrl: undefined,
      },
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      const reader = new FileReader();

      reader.onload = e => {
        const imageUrl = e.target?.result as string;

        setUploadedImage(imageUrl);
        updateVideoConfig({
          character: {
            type: 'upload',
            imageUrl,
            avatarId: undefined,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Choose Your Character</h3>
        <p className='text-sm text-default-500'>
          Select a pre-made avatar or upload your own photo to use as the
          character in your video.
        </p>
      </div>

      {/* Character Type Selection */}
      <div className='flex gap-4'>
        <Button
          color={characterType === 'avatar' ? 'primary' : 'default'}
          variant={characterType === 'avatar' ? 'solid' : 'bordered'}
          onPress={() => handleCharacterTypeChange('avatar')}
        >
          Use Avatar
        </Button>
        <Button
          color={characterType === 'upload' ? 'primary' : 'default'}
          variant={characterType === 'upload' ? 'solid' : 'bordered'}
          onPress={() => handleCharacterTypeChange('upload')}
        >
          Upload Photo
        </Button>
      </div>

      {/* Avatar Selection */}
      {characterType === 'avatar' && (
        <div>
          <h4 className='font-medium mb-3'>Select an Avatar</h4>
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {AVATARS.map(avatar => (
              <Card
                key={avatar.id}
                isPressable
                className={`cursor-pointer transition-all ${
                  selectedAvatar === avatar.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:shadow-md'
                }`}
                onPress={() => handleAvatarSelect(avatar.id)}
              >
                <CardBody className='p-4'>
                  <div className='aspect-square mb-3 overflow-hidden rounded-lg'>
                    <Image
                      alt={avatar.name}
                      className='w-full h-full object-cover'
                      height={200}
                      src={avatar.image}
                      width={200}
                    />
                  </div>
                  <h5 className='text-sm font-medium text-center'>
                    {avatar.name}
                  </h5>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Photo Upload */}
      {characterType === 'upload' && (
        <div>
          <h4 className='font-medium mb-3'>Upload Your Photo</h4>
          <div className='space-y-4'>
            <input
              ref={fileInputRef}
              accept='image/*'
              className='hidden'
              type='file'
              onChange={handleFileUpload}
            />

            {uploadedImage ? (
              <div className='space-y-4'>
                <div className='aspect-square max-w-xs mx-auto overflow-hidden rounded-lg'>
                  <Image
                    alt='Uploaded character'
                    className='w-full h-full object-cover'
                    height={300}
                    src={uploadedImage}
                    width={300}
                  />
                </div>
                <div className='text-center'>
                  <Button variant='bordered' onPress={handleUploadClick}>
                    Change Photo
                  </Button>
                </div>
              </div>
            ) : (
              <Card className='border-2 border-dashed border-default-300'>
                <CardBody className='p-8 text-center'>
                  <div className='space-y-4'>
                    <div className='text-4xl'>📷</div>
                    <div>
                      <h5 className='font-medium mb-2'>Upload Your Photo</h5>
                      <p className='text-sm text-default-500 mb-4'>
                        Upload a clear, high-quality photo of yourself or the
                        person you want to use in the video.
                      </p>
                      <Button color='primary' onPress={handleUploadClick}>
                        Choose File
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Selection Summary */}
      {(selectedAvatar || uploadedImage) && (
        <Card className='bg-primary/5 border border-primary/20'>
          <CardBody className='p-4'>
            <h4 className='font-medium mb-2'>
              Selected Character:{' '}
              {characterType === 'avatar' ? 'Avatar' : 'Custom Photo'}
            </h4>
            {characterType === 'avatar' && selectedAvatar && (
              <p className='text-sm text-default-600'>
                Using pre-made avatar for consistent results
              </p>
            )}
            {characterType === 'upload' && uploadedImage && (
              <p className='text-sm text-default-600'>
                Using your uploaded photo for personalized results
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
