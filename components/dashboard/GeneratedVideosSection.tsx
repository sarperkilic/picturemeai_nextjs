'use client';

import { useEffect } from 'react';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';

import { RefreshIcon, SearchIcon, PlayIcon, DownloadIcon, ShareIcon } from '@/components/icons';
import { useProjectsStore } from '@/lib/projects-store';
import { useSession } from '@/lib/use-firebase-auth';
import { useUGCStore } from '@/lib/ugc-store';
import { useProjectsRealtime } from '@/lib/use-realtime-updates';
import { Project } from '@/types/firebase';

export function GeneratedVideosSection() {
  const { user } = useSession();
  const { setIsModalOpen } = useUGCStore();
  
  // Use real-time updates for projects
  const { 
    projects, 
    isLoading, 
    error, 
    unsubscribe 
  } = useProjectsRealtime(10);

  // Cleanup subscription on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const formatDate = (date: any) => {
    // Handle Firestore Timestamp objects
    let jsDate: Date;
    
    if (date && typeof date.toDate === 'function') {
      // This is a Firestore Timestamp
      jsDate = date.toDate();
    } else if (date && date.seconds && typeof date.seconds === 'number') {
      // This is a serialized Firestore Timestamp (from JSON)
      jsDate = new Date(date.seconds * 1000);
    } else if (date instanceof Date) {
      // This is already a JavaScript Date
      jsDate = date;
    } else if (date && typeof date === 'number') {
      // This is a timestamp number
      jsDate = new Date(date);
    } else if (date && typeof date === 'string') {
      // This is a date string
      jsDate = new Date(date);
    } else {
      // Fallback to current date if invalid
      jsDate = new Date();
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(jsDate);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'success';
      case 'rendering':
        return 'warning';
      case 'failed':
        return 'danger';
      case 'ready':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'rendering':
        return 'Rendering';
      case 'failed':
        return 'Failed';
      case 'ready':
        return 'Ready';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-6'>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
            <span className='ml-3 text-default-500'>Loading projects...</span>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className='bg-content1/60 border border-default-100'>
        <CardBody className='p-6'>
          <div className='text-center py-8'>
            <p className='text-danger mb-4'>{error}</p>
            <Button 
              color='primary' 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className='bg-content1/60 border border-default-100'>
      <CardBody className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h2 className='text-2xl font-bold text-foreground'>
              Generated Videos
            </h2>
            <p className='text-default-500 mt-1'>
              Your UGC video projects and renders
            </p>
          </div>
          <div className='flex gap-2'>
            <Button
              isIconOnly
              variant='light'
              onClick={() => window.location.reload()}
            >
              <RefreshIcon className='w-4 h-4' />
            </Button>
            <Button
              isIconOnly
              variant='light'
            >
              <SearchIcon className='w-4 h-4' />
            </Button>
          </div>
        </div>

        {projects.length === 0 ? (
          <div className='text-center py-12'>
            <div className='w-16 h-16 bg-default-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <SearchIcon className='w-8 h-8 text-default-400' />
            </div>
            <h3 className='text-lg font-semibold text-foreground mb-2'>
              No projects yet
            </h3>
            <p className='text-default-500 mb-6'>
              Create your first UGC video project to get started
            </p>
            <Button 
              color='primary' 
              size='lg'
              onPress={() => setIsModalOpen(true)}
            >
              Create First Project
            </Button>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {projects.map((project: Project) => (
              <div
                key={project.id}
                className='p-4 rounded-lg border border-default-200 bg-background/50 hover:bg-background/70 transition-colors'
              >
                <div className='aspect-video bg-default-100 rounded-lg mb-3 flex items-center justify-center'>
                  {project.status === 'complete' ? (
                    <div className='relative w-full h-full'>
                      <img
                        src={'/images/sample1.png'}
                        alt={project.title}
                        className='w-full h-full object-cover rounded-lg'
                      />
                      <Button
                        isIconOnly
                        size='sm'
                        className='absolute top-2 right-2 bg-black/50 text-white'
                        onClick={() => {
                          // TODO: Open video player with final video URL
                          console.log('Play video for project:', project.id);
                        }}
                      >
                        <PlayIcon className='w-4 h-4' />
                      </Button>
                    </div>
                  ) : (
                    <div className='text-center'>
                      <div className='w-12 h-12 bg-default-200 rounded-full flex items-center justify-center mx-auto mb-2'>
                        <SearchIcon className='w-6 h-6 text-default-400' />
                      </div>
                      <p className='text-sm text-default-500'>No preview</p>
                    </div>
                  )}
                </div>

                <div className='space-y-2'>
                  <div className='flex items-start justify-between'>
                    <h3 className='font-semibold text-foreground text-sm line-clamp-2'>
                      {project.title}
                    </h3>
                    <Chip
                      size='sm'
                      color={getStatusColor(project.status)}
                      variant='flat'
                    >
                      {getStatusText(project.status)}
                    </Chip>
                  </div>

                  <p className='text-xs text-default-500 line-clamp-2'>
                    {project.flow.script}
                  </p>

                  <div className='flex items-center justify-between text-xs text-default-400'>
                    <span>{formatDate(project.createdAt)}</span>
                    <span>{project.duration}s</span>
                  </div>

                  <div className='flex gap-1 pt-2'>
                    {project.status === 'complete' && (
                      <>
                        <Button size='sm' variant='light' isIconOnly>
                          <PlayIcon className='w-3 h-3' />
                        </Button>
                        <Button size='sm' variant='light' isIconOnly>
                          <DownloadIcon className='w-3 h-3' />
                        </Button>
                        <Button size='sm' variant='light' isIconOnly>
                          <ShareIcon className='w-3 h-3' />
                        </Button>
                      </>
                    )}
                    <Button size='sm' variant='light' className='ml-auto'>
                      View Details
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
