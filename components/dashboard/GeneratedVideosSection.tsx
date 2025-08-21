'use client';

import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';

import { RefreshIcon, SearchIcon } from '@/components/icons';
import { useUGCStore } from '@/lib/ugc-store';

export function GeneratedVideosSection() {
  const { generatedVideos } = useUGCStore();

  const mockVideos = [
    {
      id: '1',
      thumbnail: '/images/sample1.png',
      videoUrl: '#',
      createdAt: new Date(Date.now() - 86400000), // 1 day ago
      config: {
        template: {
          id: '1',
          name: 'Professional',
          thumbnail: '',
          style: '',
          cameraMovement: '',
        },
        character: { type: 'avatar' as const },
        action: { movement: 'Talking', duration: 15 },
        audio: {
          text: 'Welcome to our product demo...',
          voice: 'Professional',
          tone: 'Friendly',
        },
        background: { type: 'preset' as const },
      },
    },
    {
      id: '2',
      thumbnail: '/images/sample2.png',
      videoUrl: '#',
      createdAt: new Date(Date.now() - 172800000), // 2 days ago
      config: {
        template: {
          id: '2',
          name: 'Casual',
          thumbnail: '',
          style: '',
          cameraMovement: '',
        },
        character: { type: 'upload' as const },
        action: { movement: 'Gesturing', duration: 20 },
        audio: {
          text: 'This is how you can improve...',
          voice: 'Casual',
          tone: 'Enthusiastic',
        },
        background: { type: 'upload' as const },
      },
    },
  ];

  const videosToShow =
    generatedVideos.length > 0 ? generatedVideos : mockVideos;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Card className='bg-content1/60 border border-default-100'>
      <CardBody className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-xl font-semibold text-foreground'>
              Generated Videos
            </h2>
            <p className='text-default-500 mt-1'>
              Your recently created UGC videos
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              size='sm'
              startContent={<SearchIcon className='w-4 h-4' />}
              variant='bordered'
            >
              Filter
            </Button>
            <Button
              size='sm'
              startContent={<RefreshIcon className='w-4 h-4' />}
              variant='bordered'
            >
              Refresh
            </Button>
          </div>
        </div>

        {videosToShow.length === 0 ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-default-100 flex items-center justify-center'>
              <RefreshIcon className='w-8 h-8 text-default-400' />
            </div>
            <h3 className='text-lg font-medium text-foreground mb-2'>
              No videos yet
            </h3>
            <p className='text-default-500 mb-4'>
              Start creating your first UGC video to see it here
            </p>
            <Button color='primary' size='sm'>
              Create First Video
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {videosToShow.map(video => (
              <div
                key={video.id}
                className='group relative overflow-hidden rounded-lg border border-default-200 bg-background/50 hover:border-primary/50 transition-colors'
              >
                <div className='aspect-video relative'>
                  <img
                    alt={`Video thumbnail ${video.id}`}
                    className='w-full h-full object-cover'
                    src={video.thumbnail}
                  />
                  <div className='absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center'>
                    <Button
                      className='bg-black/50 backdrop-blur-sm'
                      color='primary'
                      size='sm'
                      variant='solid'
                    >
                      Play
                    </Button>
                  </div>
                </div>

                <div className='p-4'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium text-foreground'>
                      {video.config.template?.name || 'Custom Video'}
                    </span>
                    <span className='text-xs text-default-500'>
                      {formatDate(video.createdAt)}
                    </span>
                  </div>

                  <div className='space-y-1'>
                    <div className='flex items-center gap-2 text-xs text-default-500'>
                      <span>Duration: {video.config.action.duration}s</span>
                      <span>•</span>
                      <span>{video.config.character.type}</span>
                    </div>

                    <p className='text-xs text-default-600 line-clamp-2'>
                      {video.config.audio.text}
                    </p>
                  </div>

                  <div className='flex gap-2 mt-3'>
                    <Button className='flex-1' size='sm' variant='bordered'>
                      Download
                    </Button>
                    <Button className='flex-1' size='sm' variant='bordered'>
                      Share
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
}
