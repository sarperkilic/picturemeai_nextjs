'use client';

import { useEffect, useState } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';
import { Button } from '@heroui/button';

import { useRenderStatus } from '@/lib/hooks/use-render-status';
import { Render } from '@/types/firebase';

interface RenderStatusProps {
  projectId: string;
  onComplete?: () => void;
}

export function RenderStatus({ projectId, onComplete }: RenderStatusProps) {
  // Use SWR for render status updates
  const { renders, isLoading, error, refreshRenderStatus } = useRenderStatus({ projectId });

  // Calculate progress and active renders
  const totalRenders = renders.length;
  const completedRenders = renders.filter(render => render.status === 'succeeded').length;
  const failedRenders = renders.filter(render => render.status === 'failed').length;
  const activeRenders = renders.filter(render => render.status === 'running' || render.status === 'queued');
  const hasActiveRenders = activeRenders.length > 0;
  const progress = totalRenders > 0 ? ((completedRenders + failedRenders) / totalRenders) * 100 : 0;

  // Check if all renders are complete
  useEffect(() => {
    if (renders.length === 0) return;

    const totalRenders = renders.length;
    const completedRenders = renders.filter(render => render.status === 'succeeded').length;
    const failedRenders = renders.filter(render => render.status === 'failed').length;
    
    // Check if all renders are complete
    if (completedRenders + failedRenders === totalRenders) {
      onComplete?.();
    }
  }, [renders, onComplete]);

  const getRenderStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'failed':
        return 'danger';
      case 'running':
        return 'warning';
      case 'queued':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRenderStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Complete';
      case 'failed':
        return 'Failed';
      case 'running':
        return 'Running';
      case 'queued':
        return 'Queued';
      default:
        return status;
    }
  };

  const getRenderName = (render: Render) => {
    switch (render.kind) {
      case 'tts':
        return 'Text-to-Speech';
      case 'avatar':
        return 'Talking Head';
      case 'final':
        return 'Final Video';
      default:
        return render.kind;
    }
  };

  if (isLoading) {
    return (
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-4'>
          <div className='flex items-center justify-center py-4'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
            <span className='ml-3 text-default-500'>Loading render status...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (!hasActiveRenders && renders.length === 0) {
    return null;
  }

  return (
    <Card className='bg-content1/60 border border-default-100'>
      <CardBody className='p-4'>
        <div className='space-y-4'>
          {/* Overall Progress */}
          <div>
            <div className='flex items-center justify-between mb-2'>
              <h3 className='text-sm font-medium text-foreground'>Generation Progress</h3>
              <span className='text-sm text-default-500'>{Math.round(progress)}%</span>
            </div>
            <div className='w-full bg-default-200 rounded-full h-2'>
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  progress === 100 ? 'bg-success' : 'bg-primary'
                }`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Render Status List */}
          <div className='space-y-3'>
            {renders.map((render) => (
              <div key={render.id} className='flex items-center justify-between p-3 bg-background/50 rounded-lg'>
                <div className='flex items-center gap-3'>
                  <div className='w-8 h-8 rounded-full bg-default-100 flex items-center justify-center'>
                    {render.kind === 'tts' && '🎤'}
                    {render.kind === 'avatar' && '🎬'}
                    {render.kind === 'final' && '🎥'}
                  </div>
                  <div>
                    <p className='text-sm font-medium text-foreground'>
                      {getRenderName(render)}
                    </p>
                    <p className='text-xs text-default-500'>
                      {render.model}
                    </p>
                  </div>
                </div>
                
                <div className='flex items-center gap-2'>
                  <Chip
                    size='sm'
                    color={getRenderStatusColor(render.status)}
                    variant='flat'
                  >
                    {getRenderStatusText(render.status)}
                  </Chip>
                  
                  {render.status === 'failed' && render.error && (
                    <Button
                      size='sm'
                      variant='light'
                      isIconOnly
                      title={render.error}
                    >
                      ⚠️
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Active Renders */}
          {hasActiveRenders && (
            <div className='mt-4 p-3 bg-warning/10 border border-warning/20 rounded-lg'>
              <div className='flex items-center gap-2'>
                <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-warning'></div>
                <span className='text-sm text-warning-600'>
                  {activeRenders.length} render{activeRenders.length > 1 ? 's' : ''} in progress...
                </span>
              </div>
            </div>
          )}

          {/* Completion Status */}
          {progress === 100 && (
            <div className='mt-4 p-3 bg-success/10 border border-success/20 rounded-lg'>
              <div className='flex items-center gap-2'>
                <span className='text-success-600'>✅</span>
                <span className='text-sm text-success-600 font-medium'>
                  Video generation complete!
                </span>
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
} 