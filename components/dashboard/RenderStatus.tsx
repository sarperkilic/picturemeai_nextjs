'use client';

import { Card, CardBody } from '@heroui/card';
import { Chip } from '@heroui/chip';

import { Render } from '@/types/firebase';

interface RenderStatusProps {
  renders: Render[];
  projectId: string;
}

export function RenderStatus({ renders, projectId }: RenderStatusProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'success';
      case 'running':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'queued':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'succeeded':
        return 'Complete';
      case 'running':
        return 'Processing';
      case 'failed':
        return 'Failed';
      case 'queued':
        return 'Queued';
      default:
        return status;
    }
  };

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'queued':
        return 0;
      case 'running':
        return 50;
      case 'succeeded':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  const getRenderTypeText = (kind: string) => {
    switch (kind) {
      case 'tts':
        return 'Text-to-Speech';
      case 'avatar':
        return 'Avatar Generation';
      case 'final':
        return 'Final Video';
      default:
        return kind;
    }
  };

  if (renders.length === 0) {
    return (
      <Card className='w-full'>
        <CardBody className='p-4'>
          <div className='text-center py-4'>
            <p className='text-sm text-default-500'>No renders yet</p>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='w-full'>
      <CardBody className='p-4'>
        <h3 className='font-semibold text-foreground mb-3'>Render Status</h3>
        <div className='space-y-3'>
          {renders.map((render) => (
            <div key={render.id} className='space-y-2'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium text-foreground'>
                  {getRenderTypeText(render.kind)}
                </span>
                <Chip
                  size='sm'
                  color={getStatusColor(render.status)}
                  variant='flat'
                >
                  {getStatusText(render.status)}
                </Chip>
              </div>
              
              {render.status === 'running' && (
                <div className='space-y-1'>
                  <div className='flex justify-between text-xs text-default-500'>
                    <span>Processing...</span>
                    <span>{getProgressValue(render.status)}%</span>
                  </div>
                  <div className='w-full bg-default-200 rounded-full h-2'>
                    <div 
                      className='bg-primary h-2 rounded-full transition-all duration-300'
                      style={{ width: `${getProgressValue(render.status)}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {render.error && (
                <div className='text-xs text-danger bg-danger-50 p-2 rounded'>
                  Error: {render.error}
                </div>
              )}

              <div className='text-xs text-default-400'>
                Model: {render.model} • ID: {render.providerJobId}
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
} 