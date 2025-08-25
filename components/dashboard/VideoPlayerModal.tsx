'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Button } from '@heroui/button';
import { Chip } from '@heroui/chip';

import { XIcon, DownloadIcon, ShareIcon } from '@/components/icons';
import { Project } from '@/types/firebase';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project | null;
}

export function VideoPlayerModal({ isOpen, onClose, project }: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen && project) {
      setIsLoading(true);
      setError(null);
      setVideoUrl(null);
      
      // Extract video URL from project renders
      extractVideoUrl(project);
    } else {
      // Reset video when modal closes
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isOpen, project]);

  const extractVideoUrl = async (project: Project) => {
    try {
      // Get the current user's ID token for authentication
      const { getAuth } = await import('firebase/auth');
      const { auth } = await import('@/lib/firebase');
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const idToken = await user.getIdToken();
      
      // Fetch video URL from API
      const response = await fetch(`/api/projects/${project.id}/video`, {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video');
      }

      const data = await response.json();
      
      if (data.success && data.data?.videoUrl) {
        setVideoUrl(data.data.videoUrl);
      } else {
        throw new Error('Video URL not available');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Failed to extract video URL:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video. Please try again.');
      setIsLoading(false);
    }
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleVideoError = () => {
    setIsLoading(false);
    setError('Failed to load video. The video may not be available yet.');
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `${project?.title || 'video'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    if (navigator.share && project) {
      navigator.share({
        title: project.title,
        text: `Check out this UGC video: ${project.title}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href).then(() => {
        // You could show a toast notification here
        console.log('Link copied to clipboard');
      }).catch(console.error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!project) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        backdrop: 'bg-black/80 backdrop-blur-sm',
        base: 'bg-background border border-default-200',
        body: 'p-0',
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{project.title}</h3>
              <p className="text-sm text-default-500">
                Duration: {formatDuration(project.duration || 0)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Chip
                size="sm"
                color={project.status === 'complete' ? 'success' : 'warning'}
                variant="flat"
              >
                {project.status === 'complete' ? 'Complete' : 'Processing'}
              </Chip>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-0">
          <div className="relative aspect-video bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
              </div>
            )}
            
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <p className="text-lg font-medium mb-2">Video Unavailable</p>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              </div>
            )}

            {videoUrl && !error && (
              <video
                ref={videoRef}
                className="w-full h-full object-contain"
                controls
                preload="metadata"
                onLoadStart={() => setIsLoading(true)}
                onLoadedData={handleVideoLoad}
                onError={handleVideoError}
              >
                <source src={videoUrl} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
          </div>

          {project.flow?.script && (
            <div className="p-4 border-t border-default-200">
              <h4 className="font-medium mb-2">Script</h4>
              <p className="text-sm text-default-600 leading-relaxed">
                {project.flow.script}
              </p>
            </div>
          )}
        </ModalBody>

        <ModalFooter className="flex justify-between">
          <div className="flex gap-2">
            <Button
              variant="light"
              startContent={<DownloadIcon className="w-4 h-4" />}
              onPress={handleDownload}
              isDisabled={!videoUrl || !!error}
            >
              Download
            </Button>
            <Button
              variant="light"
              startContent={<ShareIcon className="w-4 h-4" />}
              onPress={handleShare}
            >
              Share
            </Button>
          </div>
          
          <Button
            variant="light"
            startContent={<XIcon className="w-4 h-4" />}
            onPress={onClose}
          >
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 