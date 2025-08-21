'use client';

import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';

import { RefreshIcon } from '@/components/icons';
import { useUGCStore } from '@/lib/ugc-store';

const guideSteps = [
  {
    id: 1,
    title: 'Choose Template',
    description: 'Select a video template that matches your content style',
    status: 'pending' as const,
  },
  {
    id: 2,
    title: 'Upload Character',
    description: 'Add your photo or choose an AI avatar',
    status: 'pending' as const,
  },
  {
    id: 3,
    title: 'Set Actions',
    description: 'Define character movements and gestures',
    status: 'pending' as const,
  },
  {
    id: 4,
    title: 'Write Script',
    description: 'Create engaging dialogue for your video',
    status: 'pending' as const,
  },
  {
    id: 5,
    title: 'Configure Audio',
    description: 'Select voice and tone for narration',
    status: 'pending' as const,
  },
  {
    id: 6,
    title: 'Choose Background',
    description: 'Pick a background or upload your own',
    status: 'pending' as const,
  },
];

export function GenerationGuide() {
  const { setIsModalOpen } = useUGCStore();

  const handleStartGeneration = () => {
    setIsModalOpen(true);
  };

  return (
    <Card className='bg-content1/60 border border-default-100'>
      <CardBody className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-foreground'>
              UGC Video Builder
            </h2>
            <p className='text-default-500 mt-1'>
              Create engaging user-generated content videos in 6 simple steps
            </p>
          </div>
          <Button
            color='primary'
            size='lg'
            startContent={<RefreshIcon className='w-4 h-4' />}
            onClick={handleStartGeneration}
          >
            Start Generation
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {guideSteps.map(step => (
            <div
              key={step.id}
              className='p-4 rounded-lg border border-default-200 bg-background/50'
            >
              <div className='flex items-start gap-3'>
                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center'>
                  <span className='text-sm font-semibold text-primary'>
                    {step.id}
                  </span>
                </div>
                <div className='flex-1'>
                  <h3 className='font-semibold text-foreground mb-1'>
                    {step.title}
                  </h3>
                  <p className='text-sm text-default-500'>{step.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className='mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20'>
          <div className='flex items-start gap-3'>
            <div className='w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5'>
              <span className='text-xs text-primary-foreground font-bold'>
                !
              </span>
            </div>
            <div>
              <h4 className='font-semibold text-foreground mb-1'>Pro Tip</h4>
              <p className='text-sm text-default-600'>
                Start with a clear script and engaging visuals. Our AI will help
                you create professional-looking UGC videos that resonate with
                your audience.
              </p>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
