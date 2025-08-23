'use client';

import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';

import { PlayIcon, DownloadIcon, ShareIcon, EditIcon, DeleteIcon } from '@/components/icons';
import { Project } from '@/types/firebase';

interface ProjectCardProps {
  project: Project;
  onEdit?: (project: Project) => void;
  onDelete?: (projectId: string) => void;
  onView?: (project: Project) => void;
}

export function ProjectCard({ project, onEdit, onDelete, onView }: ProjectCardProps) {
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

  const getProgressValue = (status: string) => {
    switch (status) {
      case 'draft':
        return 0;
      case 'ready':
        return 25;
      case 'rendering':
        return 75;
      case 'complete':
        return 100;
      case 'failed':
        return 0;
      default:
        return 0;
    }
  };

  return (
    <Card className='w-full'>
      <CardBody className='p-4'>
        <div className='aspect-video bg-default-100 rounded-lg mb-3 flex items-center justify-center'>
          {project.status === 'complete' ? (
            <div className='relative w-full h-full'>
              <img
                src={`/api/projects/${project.id}/thumbnail` || '/images/sample1.png'}
                alt={project.title}
                className='w-full h-full object-cover rounded-lg'
              />
              <Button
                isIconOnly
                size='sm'
                className='absolute top-2 right-2 bg-black/50 text-white'
              >
                <PlayIcon className='w-4 h-4' />
              </Button>
            </div>
          ) : (
            <div className='text-center'>
              <div className='w-16 h-16 bg-default-200 rounded-full flex items-center justify-center mx-auto mb-2'>
                <div className='w-8 h-8 bg-default-300 rounded-full'></div>
              </div>
              <p className='text-sm text-default-500'>Processing...</p>
            </div>
          )}
        </div>

        <div className='space-y-3'>
          <div className='flex items-start justify-between'>
            <h3 className='font-semibold text-foreground text-sm line-clamp-2 flex-1 mr-2'>
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

          {project.status === 'rendering' && (
            <div className='space-y-1'>
              <div className='flex justify-between text-xs text-default-500'>
                <span>Rendering...</span>
                <span>{getProgressValue(project.status)}%</span>
              </div>
              <div className='w-full bg-default-200 rounded-full h-2'>
                <div 
                  className='bg-primary h-2 rounded-full transition-all duration-300'
                  style={{ width: `${getProgressValue(project.status)}%` }}
                ></div>
              </div>
            </div>
          )}

          <p className='text-xs text-default-500 line-clamp-2'>
            {project.flow.script}
          </p>

          <div className='flex items-center justify-between text-xs text-default-400'>
            <span>{formatDate(project.createdAt)}</span>
            <span>{project.duration}s • {project.usedCredits} credits</span>
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
            
            <div className='flex gap-1 ml-auto'>
              <Button 
                size='sm' 
                variant='light' 
                isIconOnly
                onPress={() => onEdit?.(project)}
              >
                <EditIcon className='w-3 h-3' />
              </Button>
              <Button 
                size='sm' 
                variant='light' 
                isIconOnly
                color='danger'
                onPress={() => onDelete?.(project.id)}
              >
                <DeleteIcon className='w-3 h-3' />
              </Button>
              <Button 
                size='sm' 
                variant='light'
                onPress={() => onView?.(project)}
              >
                View Details
              </Button>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
} 