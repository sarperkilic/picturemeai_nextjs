'use client';

import { useState } from 'react';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from '@heroui/modal';
import { Card, CardBody } from '@heroui/card';
import { Button } from '@heroui/button';

import { CheckIcon } from '@/components/icons';
import { useUGCStore } from '@/lib/ugc-store';
import { VideoGenerationService } from '@/lib/video-generation-service';
import { useSession } from '@/lib/use-firebase-auth';
import { useProjectsStore } from '@/lib/projects-store';
import { FirebaseAuthClient } from '@/lib/firebase-auth';

import { ImageStep } from './ugc-steps/ImageStep';
import { AudioTextStep } from './ugc-steps/AudioTextStep';
import { AudioSettingsStep } from './ugc-steps/AudioSettingsStep';

const STEPS = [
  { id: 0, name: 'Character', component: ImageStep },
  { id: 1, name: 'Script', component: AudioTextStep },
  { id: 2, name: 'Voice', component: AudioSettingsStep },
];

export function UGCModal() {
  const { user } = useSession();
  const { fetchProjectsForDashboard } = useProjectsStore();
  const {
    isModalOpen,
    setIsModalOpen,
    currentStep,
    setCurrentStep,
    videoConfig,
    resetVideoConfig,
    validateVideoConfig,
    showToast,
    triggerRefresh,
  } = useUGCStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  const handleClose = () => {
    setIsModalOpen(false);
    setCurrentStep(0);
    resetVideoConfig();
    // Trigger refresh of Generated Videos section
    triggerRefresh();
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Only allow navigation to completed steps or the next available step
    if (stepId <= currentStep || canNavigateToStep(stepId)) {
      setCurrentStep(stepId);
    }
  };

  const canNavigateToStep = (stepId: number): boolean => {
    // Check if all previous steps are completed
    for (let i = 0; i < stepId; i++) {
      if (!isStepCompleted(i)) {
        return false;
      }
    }

    return true;
  };

  const isStepCompleted = (stepId: number): boolean => {
    switch (stepId) {
      case 0: // Character
        return videoConfig.character.type === 'avatar'
          ? !!videoConfig.character.avatarId
          : !!videoConfig.character.imageUrl;
      case 1: // Script
        return videoConfig.audio.text.length >= 10;
      case 2: // Voice
        return !!videoConfig.audio.voice;
      default:
        return false;
    }
  };

  const isCurrentStepValid = (): boolean => {
    return isStepCompleted(currentStep);
  };

  const isAllStepsCompleted = (): boolean => {
    return STEPS.every((_, index) => isStepCompleted(index));
  };

  const handleGenerate = async () => {
    if (!user?.id) return;

    // Validate video config before generation
    const validation = validateVideoConfig();
    if (!validation.isValid) {
      setProgressMessage(`Validation Error: ${validation.errors.join(', ')}`);
      return;
    }

    setIsGenerating(true);
    setProgressMessage('Starting video generation...');
    
    // Ensure we have a valid image URL for the video generation
    let imageUrl = videoConfig.character.imageUrl;
    
    // If we have an avatarId but no imageUrl, we need to fetch the avatar template
    if (videoConfig.character.type === 'avatar' && videoConfig.character.avatarId && !imageUrl) {
      try {
        const { getAvatarTemplateById } = await import('@/lib/avatar-selection');
        const avatarTemplate = await getAvatarTemplateById(videoConfig.character.avatarId);
        imageUrl = avatarTemplate.storage_url;
      } catch (error) {
        console.error('Failed to fetch avatar template:', error);
        showToast('Failed to load selected avatar. Please try again.', 'error');
        setIsGenerating(false);
        return;
      }
    }
    
    // Validate that we have an image URL
    if (!imageUrl) {
      showToast('No image selected for video generation. Please select an avatar or upload an image.', 'error');
      setIsGenerating(false);
      return;
    }

    const config = {
      script: videoConfig.audio.text,
      voiceId: videoConfig.audio.voice,
      avatarId: videoConfig.character.avatarId || 'default',
      imageUrl: imageUrl,
    };

    console.log('Starting video generation with config:', config);

    try {
      // Close modal immediately to provide better UX
      handleClose();

      // Show initial success toast
      showToast('Video generation started! Check your projects below.', 'success');

      // Start video generation using server-side API
      const response = await fetch('/api/projects/generate-video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await FirebaseAuthClient.getIdToken()}`,
        },
        body: JSON.stringify(config),
      });

      const result = await response.json();

      if (result.success) {
        console.log('Video generation started successfully:', result.data);
        // Show success toast
        showToast('Video generation started successfully!', 'success');
        // Refresh projects to show new project
        fetchProjectsForDashboard(user.id, 10);
      } else {
        console.error('Error starting video generation:', result.error);
        // Show error toast
        showToast(
          `Video generation failed: ${result.error}`,
          'error'
        );
      }

    } catch (error) {
      console.error('Error creating project:', error);
      showToast('Failed to create project. Please try again.', 'error');
    }
    
    setIsGenerating(false);
  };

  const CurrentStepComponent = STEPS[currentStep].component;

  return (
    <Modal
      isOpen={isModalOpen}
      scrollBehavior='inside'
      size='5xl'
      onClose={handleClose}
    >
      <ModalContent>
        <ModalHeader className='flex flex-col gap-1'>
          <h2 className='text-xl font-semibold'>Create UGC Video</h2>
          <p className='text-sm text-default-500'>
            Configure your video generation settings
          </p>
        </ModalHeader>

        <ModalBody>
          <div className='flex gap-6'>
            {/* Left Navigation Panel */}
            <div className='w-64 flex-shrink-0'>
              <Card className='bg-content1/60 border border-default-100'>
                <CardBody className='p-4'>
                  <div className='space-y-2'>
                    {STEPS.map(step => {
                      const isCompleted = isStepCompleted(step.id);
                      const isActive = currentStep === step.id;
                      const canNavigate =
                        step.id <= currentStep || canNavigateToStep(step.id);

                      return (
                        <button
                          key={step.id}
                          className={`w-full text-left p-3 rounded-lg transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground'
                              : isCompleted
                                ? 'bg-success/20 text-success border border-success/30'
                                : canNavigate
                                  ? 'bg-default-100 hover:bg-default-200'
                                  : 'bg-default-50 text-default-400 cursor-not-allowed'
                          }`}
                          disabled={!canNavigate}
                          onClick={() => handleStepClick(step.id)}
                        >
                          <div className='flex items-center gap-3'>
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                isActive
                                  ? 'bg-primary-foreground text-primary'
                                  : isCompleted
                                    ? 'bg-success text-success-foreground'
                                    : 'bg-default-300 text-default-600'
                              }`}
                            >
                              {isCompleted ? (
                                <CheckIcon className='w-3 h-3' />
                              ) : (
                                step.id + 1
                              )}
                            </div>
                            <span className='font-medium'>{step.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* Right Content Area */}
            <div className='flex-1'>
              <Card className='bg-content1/60 border border-default-100'>
                <CardBody className='p-6'>
                  <CurrentStepComponent />
                </CardBody>
              </Card>
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className='flex justify-between w-full'>
            <Button
              isDisabled={currentStep === 0}
              variant='light'
              onPress={handlePrevious}
            >
              Previous
            </Button>

            <div className='flex gap-2'>
              <Button variant='light' onPress={handleClose}>
                Cancel
              </Button>

              {currentStep === STEPS.length - 1 ? (
                <div className='flex flex-col items-end gap-2'>
                  {progressMessage && (
                    <p className='text-sm text-default-500'>{progressMessage}</p>
                  )}
                  <Button
                    color='primary'
                    isDisabled={!isAllStepsCompleted() || !user?.id}
                    isLoading={isGenerating}
                    onPress={handleGenerate}
                  >
                    Generate Video
                  </Button>
                </div>
              ) : (
                <Button
                  color='primary'
                  isDisabled={!isCurrentStepValid()}
                  onPress={handleNext}
                >
                  Next
                </Button>
              )}
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
