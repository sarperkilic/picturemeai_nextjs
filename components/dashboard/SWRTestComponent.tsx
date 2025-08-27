'use client';

import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';
import { useVideos, refreshVideosList } from '@/lib/hooks/use-videos';

export function SWRTestComponent() {
  const { 
    videos, 
    isLoading, 
    error, 
    refreshVideos, 
    hasProcessingVideos 
  } = useVideos({ limit: 5 });

  const handleRefresh = () => {
    refreshVideos();
  };

  const handleGlobalRefresh = () => {
    refreshVideosList();
  };

  if (isLoading) {
    return (
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-4'>
          <div className='flex items-center justify-center py-4'>
            <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
            <span className='ml-3 text-default-500'>Loading videos...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-4'>
          <div className='text-center py-4'>
            <div className='text-danger mb-4'>⚠️</div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>Error Loading Videos</h3>
            <p className='text-default-500 mb-4'>{error.message}</p>
            <Button color='primary' variant='flat' size='sm' onPress={handleRefresh}>
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='bg-content1/60 border border-default-100'>
      <CardBody className='p-4'>
        <div className='space-y-4'>
          {/* Header with controls */}
          <div className='flex items-center justify-between'>
            <div>
              <h3 className='text-lg font-semibold text-foreground'>SWR Test Component</h3>
              <p className='text-sm text-default-500'>
                Testing SWR video fetching and refresh functionality
                {hasProcessingVideos && (
                  <span className='ml-2 inline-flex items-center gap-1 text-primary'>
                    <div className='w-2 h-2 bg-primary rounded-full animate-pulse'></div>
                    Auto-refreshing
                  </span>
                )}
              </p>
            </div>
            <div className='flex gap-2'>
              <Button size='sm' variant='light' onPress={handleRefresh}>
                Refresh
              </Button>
              <Button size='sm' variant='light' onPress={handleGlobalRefresh}>
                Global Refresh
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className='grid grid-cols-3 gap-4'>
            <div className='text-center p-3 bg-background/50 rounded-lg'>
              <div className='text-2xl font-bold text-primary'>{videos.length}</div>
              <div className='text-xs text-default-500'>Total Videos</div>
            </div>
            <div className='text-center p-3 bg-background/50 rounded-lg'>
              <div className='text-2xl font-bold text-success'>
                {videos.filter(v => v.status === 'complete').length}
              </div>
              <div className='text-xs text-default-500'>Complete</div>
            </div>
            <div className='text-center p-3 bg-background/50 rounded-lg'>
              <div className='text-2xl font-bold text-warning'>
                {videos.filter(v => v.status !== 'complete').length}
              </div>
              <div className='text-xs text-default-500'>Processing</div>
            </div>
          </div>

          {/* Video List */}
          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-foreground'>Recent Videos</h4>
            {videos.length === 0 ? (
              <div className='text-center py-8 text-default-500'>
                No videos found
              </div>
            ) : (
              <div className='space-y-2'>
                {videos.map((video) => (
                  <div key={video.id} className='flex items-center justify-between p-3 bg-background/50 rounded-lg'>
                    <div>
                      <p className='text-sm font-medium text-foreground'>{video.title}</p>
                      <p className='text-xs text-default-500'>{video.flow.script.substring(0, 50)}...</p>
                    </div>
                    <Chip
                      size='sm'
                      color={
                        video.status === 'complete' ? 'success' :
                        video.status === 'rendering' ? 'warning' :
                        video.status === 'failed' ? 'danger' : 'default'
                      }
                      variant='flat'
                    >
                      {video.status}
                    </Chip>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Debug Info */}
          <div className='mt-4 p-3 bg-default-100 rounded-lg'>
            <h4 className='text-sm font-medium text-foreground mb-2'>Debug Info</h4>
            <div className='text-xs text-default-500 space-y-1'>
              <div>• Videos loaded: {videos.length}</div>
              <div>• Has processing videos: {hasProcessingVideos ? 'Yes' : 'No'}</div>
              <div>• Auto-refresh active: {hasProcessingVideos ? 'Yes' : 'No'}</div>
              <div>• Last updated: {new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 