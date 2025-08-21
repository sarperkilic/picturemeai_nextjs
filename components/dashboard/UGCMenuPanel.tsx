'use client';

import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';

import { RefreshIcon, SearchIcon, ZoomIcon } from '@/components/icons';
import { useUGCStore } from '@/lib/ugc-store';
import { type GenerationMode } from '@/types/ugc';

const generationModes: Array<{
  id: GenerationMode;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  {
    id: 'UGC Builder',
    label: 'UGC Builder',
    description: 'Create engaging UGC videos with AI',
    icon: RefreshIcon,
  },
  {
    id: 'Template Library',
    label: 'Template Library',
    description: 'Choose from pre-made video templates',
    icon: SearchIcon,
  },
  {
    id: 'Custom Video',
    label: 'Custom Video',
    description: 'Build videos from scratch',
    icon: ZoomIcon,
  },
];

export function UGCMenuPanel() {
  const { selectedGenerationMode, setSelectedGenerationMode } = useUGCStore();

  return (
    <Card className='bg-content1/60 border border-default-100'>
      <CardBody className='p-4'>
        <div className='space-y-2'>
          <h3 className='text-lg font-semibold text-foreground mb-4'>
            Generation Modes
          </h3>

          {generationModes.map(mode => {
            const Icon = mode.icon;
            const isSelected = selectedGenerationMode === mode.id;

            return (
              <Button
                key={mode.id}
                className={`w-full justify-start h-auto p-3 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-default-100'
                }`}
                color={isSelected ? 'primary' : 'default'}
                variant={isSelected ? 'solid' : 'light'}
                onClick={() => setSelectedGenerationMode(mode.id)}
              >
                <div className='flex items-start gap-3 text-left'>
                  <Icon
                    className={`w-5 h-5 mt-0.5 ${
                      isSelected
                        ? 'text-primary-foreground'
                        : 'text-default-500'
                    }`}
                  />
                  <div className='flex-1'>
                    <div
                      className={`font-medium ${
                        isSelected
                          ? 'text-primary-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {mode.label}
                    </div>
                    <div
                      className={`text-sm ${
                        isSelected
                          ? 'text-primary-foreground/80'
                          : 'text-default-500'
                      }`}
                    >
                      {mode.description}
                    </div>
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
