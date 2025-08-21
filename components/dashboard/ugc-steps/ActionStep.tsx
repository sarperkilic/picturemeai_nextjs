'use client';

import { useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Input } from '@heroui/input';

import { useUGCStore } from '@/lib/ugc-store';

const MOVEMENT_OPTIONS = [
  {
    id: 'static',
    name: 'Static',
    description: 'Character stays in place, minimal movement',
    icon: '🎯',
  },
  {
    id: 'gentle',
    name: 'Gentle Movement',
    description: 'Subtle head movements and gestures',
    icon: '🌊',
  },
  {
    id: 'energetic',
    name: 'Energetic',
    description: 'Dynamic movements and expressions',
    icon: '⚡',
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Controlled, business-like movements',
    icon: '💼',
  },
  {
    id: 'casual',
    name: 'Casual',
    description: 'Relaxed, natural movements',
    icon: '😊',
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    description: 'Expressive, theatrical movements',
    icon: '🎭',
  },
];

export function ActionStep() {
  const { videoConfig, updateVideoConfig } = useUGCStore();
  const [selectedMovement, setSelectedMovement] = useState<string>(
    videoConfig.action.movement || ''
  );
  const [duration, setDuration] = useState<number>(
    videoConfig.action.duration || 10
  );

  const handleMovementSelect = (movementId: string) => {
    setSelectedMovement(movementId);
    updateVideoConfig({
      action: {
        movement: movementId,
        duration: duration,
      },
    });
  };

  const handleDurationChange = (value: string) => {
    const numValue = parseInt(value) || 10;

    setDuration(numValue);
    updateVideoConfig({
      action: {
        movement: selectedMovement,
        duration: numValue,
      },
    });
  };

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>
          Configure Character Movement
        </h3>
        <p className='text-sm text-default-500'>
          Choose how your character will move and behave in the video.
        </p>
      </div>

      {/* Movement Style Selection */}
      <div>
        <h4 className='font-medium mb-3'>Movement Style</h4>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          {MOVEMENT_OPTIONS.map(movement => (
            <Card
              key={movement.id}
              isPressable
              className={`cursor-pointer transition-all ${
                selectedMovement === movement.id
                  ? 'ring-2 ring-primary border-primary'
                  : 'hover:shadow-md'
              }`}
              onPress={() => handleMovementSelect(movement.id)}
            >
              <CardBody className='p-4'>
                <div className='flex items-start gap-3'>
                  <div className='text-2xl'>{movement.icon}</div>
                  <div className='flex-1'>
                    <h5 className='font-medium text-sm mb-1'>
                      {movement.name}
                    </h5>
                    <p className='text-xs text-default-500'>
                      {movement.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Duration Input */}
      <div>
        <h4 className='font-medium mb-3'>Video Duration</h4>
        <div className='space-y-4'>
          <div className='max-w-xs'>
            <Input
              label='Duration (seconds)'
              max={30}
              min={5}
              placeholder='10'
              type='number'
              value={duration.toString()}
              onChange={e => handleDurationChange(e.target.value)}
            />
          </div>
          <div className='text-center'>
            <span className='text-lg font-semibold'>{duration} seconds</span>
            <p className='text-xs text-default-500 mt-1'>
              {duration < 10 && 'Short videos work well for social media'}
              {duration >= 10 &&
                duration < 20 &&
                'Medium length for detailed content'}
              {duration >= 20 && 'Longer videos for comprehensive explanations'}
            </p>
          </div>
        </div>
      </div>

      {/* Preview Information */}
      {selectedMovement && (
        <Card className='bg-primary/5 border border-primary/20'>
          <CardBody className='p-4'>
            <h4 className='font-medium mb-2'>Movement Preview</h4>
            <div className='grid grid-cols-2 gap-4 text-sm'>
              <div>
                <span className='text-default-500'>Style:</span>
                <span className='ml-2 font-medium'>
                  {MOVEMENT_OPTIONS.find(m => m.id === selectedMovement)?.name}
                </span>
              </div>
              <div>
                <span className='text-default-500'>Duration:</span>
                <span className='ml-2 font-medium'>{duration} seconds</span>
              </div>
            </div>
            <p className='text-xs text-default-600 mt-2'>
              {
                MOVEMENT_OPTIONS.find(m => m.id === selectedMovement)
                  ?.description
              }
            </p>
          </CardBody>
        </Card>
      )}

      {/* Tips */}
      <Card className='bg-default-50 border border-default-200'>
        <CardBody className='p-4'>
          <h4 className='font-medium mb-2 text-sm'>
            💡 Tips for Better Results
          </h4>
          <ul className='text-xs text-default-600 space-y-1'>
            <li>• Choose movement style that matches your content tone</li>
            <li>• Shorter videos (5-15s) work best for social media</li>
            <li>
              • Longer videos (20-30s) are great for detailed explanations
            </li>
            <li>• Professional movement works well for business content</li>
            <li>• Energetic movement is perfect for entertainment content</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
