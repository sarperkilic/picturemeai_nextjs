'use client';

import { useState, useRef } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import Image from 'next/image';

import { useUGCStore } from '@/lib/ugc-store';

// Mock background presets
const BACKGROUND_PRESETS = [
  {
    id: '1',
    name: 'Modern Office',
    image: '/images/sample1.png',
    category: 'Professional',
  },
  {
    id: '2',
    name: 'Cozy Home',
    image: '/images/sample2.png',
    category: 'Lifestyle',
  },
  {
    id: '3',
    name: 'Studio Setup',
    image: '/images/sample3.png',
    category: 'Professional',
  },
  {
    id: '4',
    name: 'Outdoor Park',
    image: '/images/sample4.png',
    category: 'Lifestyle',
  },
  {
    id: '5',
    name: 'Minimal White',
    image: '/images/sample5.png',
    category: 'Minimal',
  },
  {
    id: '6',
    name: 'Gradient Blue',
    image: '/images/sample6.png',
    category: 'Abstract',
  },
  {
    id: '7',
    name: 'Urban Street',
    image: '/images/sample7.png',
    category: 'Urban',
  },
  {
    id: '8',
    name: 'Nature Scene',
    image: '/images/sample8.png',
    category: 'Nature',
  },
];

const CATEGORIES = [
  'All',
  'Professional',
  'Lifestyle',
  'Minimal',
  'Abstract',
  'Urban',
  'Nature',
];

export function BackgroundStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [backgroundType, setBackgroundType] = useState<'preset' | 'upload'>(
    videoConfig.background.type
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    videoConfig.background.presetId || null
  );
  const [uploadedBackground, setUploadedBackground] = useState<string | null>(
    videoConfig.background.imageUrl || null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackgroundTypeChange = (type: 'preset' | 'upload') => {
    setBackgroundType(type);
    updateVideoConfig({
      background: {
        type,
        presetId: type === 'preset' ? selectedPreset || undefined : undefined,
        imageUrl:
          type === 'upload' ? uploadedBackground || undefined : undefined,
      },
    });
  };

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    updateVideoConfig({
      background: {
        type: 'preset',
        presetId,
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

        setUploadedBackground(imageUrl);
        updateVideoConfig({
          background: {
            type: 'upload',
            imageUrl,
            presetId: undefined,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const filteredPresets = BACKGROUND_PRESETS.filter(
    preset => selectedCategory === 'All' || preset.category === selectedCategory
  );

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Choose Your Background</h3>
        <p className='text-sm text-default-500'>
          Select a background preset or upload your own image to set the scene
          for your video.
        </p>
      </div>

      {/* Background Type Selection */}
      <div className='flex gap-4'>
        <Button
          color={backgroundType === 'preset' ? 'primary' : 'default'}
          variant={backgroundType === 'preset' ? 'solid' : 'bordered'}
          onPress={() => handleBackgroundTypeChange('preset')}
        >
          Use Preset
        </Button>
        <Button
          color={backgroundType === 'upload' ? 'primary' : 'default'}
          variant={backgroundType === 'upload' ? 'solid' : 'bordered'}
          onPress={() => handleBackgroundTypeChange('upload')}
        >
          Upload Image
        </Button>
      </div>

      {/* Preset Background Selection */}
      {backgroundType === 'preset' && (
        <div>
          <h4 className='font-medium mb-3'>Background Presets</h4>

          {/* Category Filter */}
          <div className='flex flex-wrap gap-2 mb-4'>
            {CATEGORIES.map(category => (
              <Button
                key={category}
                color={selectedCategory === category ? 'primary' : 'default'}
                size='sm'
                variant={selectedCategory === category ? 'solid' : 'bordered'}
                onPress={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
            {filteredPresets.map(preset => (
              <Card
                key={preset.id}
                isPressable
                className={`cursor-pointer transition-all ${
                  selectedPreset === preset.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:shadow-md'
                }`}
                onPress={() => handlePresetSelect(preset.id)}
              >
                <CardBody className='p-3'>
                  <div className='aspect-video mb-2 overflow-hidden rounded-lg'>
                    <Image
                      alt={preset.name}
                      className='w-full h-full object-cover'
                      height={150}
                      src={preset.image}
                      width={200}
                    />
                  </div>
                  <div>
                    <h5 className='text-sm font-medium mb-1'>{preset.name}</h5>
                    <span className='px-2 py-1 bg-default-100 text-xs rounded-full'>
                      {preset.category}
                    </span>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Background Upload */}
      {backgroundType === 'upload' && (
        <div>
          <h4 className='font-medium mb-3'>Upload Background Image</h4>
          <div className='space-y-4'>
            <input
              ref={fileInputRef}
              accept='image/*'
              className='hidden'
              type='file'
              onChange={handleFileUpload}
            />

            {uploadedBackground ? (
              <div className='space-y-4'>
                <div className='aspect-video max-w-md mx-auto overflow-hidden rounded-lg'>
                  <Image
                    alt='Uploaded background'
                    className='w-full h-full object-cover'
                    height={300}
                    src={uploadedBackground}
                    width={400}
                  />
                </div>
                <div className='text-center'>
                  <Button variant='bordered' onPress={handleUploadClick}>
                    Change Background
                  </Button>
                </div>
              </div>
            ) : (
              <Card className='border-2 border-dashed border-default-300'>
                <CardBody className='p-8 text-center'>
                  <div className='space-y-4'>
                    <div className='text-4xl'>🖼️</div>
                    <div>
                      <h5 className='font-medium mb-2'>
                        Upload Background Image
                      </h5>
                      <p className='text-sm text-default-500 mb-4'>
                        Upload a high-quality image to use as your video
                        background. Recommended size: 1920x1080 or higher.
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
      {(selectedPreset || uploadedBackground) && (
        <Card className='bg-primary/5 border border-primary/20'>
          <CardBody className='p-4'>
            <h4 className='font-medium mb-2'>
              Selected Background:{' '}
              {backgroundType === 'preset' ? 'Preset' : 'Custom Image'}
            </h4>
            {backgroundType === 'preset' && selectedPreset && (
              <p className='text-sm text-default-600'>
                Using pre-designed background for consistent quality
              </p>
            )}
            {backgroundType === 'upload' && uploadedBackground && (
              <p className='text-sm text-default-600'>
                Using your uploaded image for personalized background
              </p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Tips */}
      <Card className='bg-default-50 border border-default-200'>
        <CardBody className='p-4'>
          <h4 className='font-medium mb-2 text-sm'>🎨 Background Tips</h4>
          <ul className='text-xs text-default-600 space-y-1'>
            <li>• Choose backgrounds that complement your content and brand</li>
            <li>• Professional backgrounds work well for business content</li>
            <li>• Simple backgrounds keep focus on your character</li>
            <li>• High contrast backgrounds make your character stand out</li>
            <li>• Avoid busy patterns that might distract from your message</li>
            <li>• Consider your target audience when selecting backgrounds</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
